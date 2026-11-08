/**
 * MySQL table definitions shared by the website and scripts/export-firebase-to-mysql.ts.
 * No Firebase or network access here, so this file can be tested on its own.
 *
 * Table layout (one table per Firestore collection):
 *   id          VARCHAR(255) PRIMARY KEY   Firestore document id
 *   data        JSON                       the whole document, converted to plain JSON
 *   created_at  DATETIME(3) NULL           from the document's createdAt, if any
 *   updated_at  DATETIME(3) NULL           from the document's updatedAt, if any
 *   synced_at   VARCHAR(32)                id of the export run that last wrote the row
 *   + one indexed, read-only column per field the site filters or sorts on
 *     (taken from firestore.indexes.json), e.g. bookings.driverId -> f_driverId
 *
 * Timestamps inside `data` are stored as ISO-8601 UTC strings,
 * GeoPoints as {"latitude":..,"longitude":..}, document references as their
 * path string, and binary values as base64.
 */

import { escape, escapeId } from "mysql2";

/** Fields the site queries on, per collection (from firestore.indexes.json plus a few lookups). */
export const INDEXED_FIELDS: Record<string, string[]> = {
  audit_logs: ["action", "entityType", "timestamp", "userId"],
  bookings: ["bookingStatus", "createdAt", "date", "driverId", "operatorId", "passengerId", "status"],
  documents: ["documentType", "driverId", "status", "uploadedAt"],
  driver_earnings: ["createdAt", "driverId", "paidOut"],
  driver_locations: ["available", "updatedAt"],
  fare_calculations: ["createdAt", "userId"],
  notifications: ["createdAt", "read", "type", "userId"],
  operator_earnings: ["createdAt", "operatorId", "paidOut"],
  payments: ["bookingId", "createdAt", "status", "userId"],
  payouts: ["createdAt", "driverId", "operatorId", "status", "userId"],
  pricing_rules: ["active", "operatorId", "vehicleType"],
  promo_codes: ["code", "createdAt", "isActive", "operatorId"],
  quotes: ["bookingId", "createdAt", "operatorId"],
  reviews: ["createdAt", "driverId", "operatorId", "rating", "revieweeId"],
  saved_locations: ["isDefault", "userId"],
  scheduled_rides: ["passengerId", "scheduledDate"],
  support_tickets: ["createdAt", "priority", "status", "userId"],
  users: ["role", "email"],
};

/** Every collection the site's code or security rules refer to. Tables are created for all of them. */
export const KNOWN_COLLECTIONS = [
  "audit_logs", "bookings", "documents", "driverDocuments", "driver_earnings",
  "driver_location_history", "driver_locations", "drivers", "email_logs",
  "fare_calculations", "guest_bookings", "notifications", "operator_earnings",
  "operators", "passengers", "payments", "payouts", "pricing_rules",
  "promo_code_usage", "promo_codes", "quotes", "reviews", "saved_locations",
  "scheduled_rides", "settings", "support_tickets", "users", "vehicles", "zones",
];

// ---------------------------------------------------------------------------
// Firestore value -> plain JSON
// ---------------------------------------------------------------------------

type Plain = null | boolean | number | string | Plain[] | { [k: string]: Plain };

function isTimestampLike(v: object): v is { toDate(): Date } {
  return typeof (v as { toDate?: unknown }).toDate === "function";
}

function isGeoPointLike(v: object): v is { latitude: number; longitude: number } {
  const ctor = (v as { constructor?: { name?: string } }).constructor?.name;
  return ctor === "GeoPoint" && "latitude" in v && "longitude" in v;
}

function isDocRefLike(v: object): v is { path: string } {
  const ctor = (v as { constructor?: { name?: string } }).constructor?.name;
  return ctor === "DocumentReference" && typeof (v as { path?: unknown }).path === "string";
}

export function toPlain(value: unknown): Plain {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean" || typeof value === "string") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
    return Buffer.from(value).toString("base64");
  }
  if (Array.isArray(value)) return value.map(toPlain);
  if (typeof value === "object") {
    if (isTimestampLike(value)) return value.toDate().toISOString();
    if (isGeoPointLike(value)) return { latitude: value.latitude, longitude: value.longitude };
    if (isDocRefLike(value)) return value.path;
    const out: { [k: string]: Plain } = {};
    for (const [k, v] of Object.entries(value)) out[k] = toPlain(v);
    return out;
  }
  return String(value);
}

/** ISO string -> MySQL DATETIME(3) literal value, or null. */
export function toMysqlDatetime(value: Plain | undefined): string | null {
  if (typeof value !== "string") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const year = d.getUTCFullYear();
  if (year < 1000 || year > 9999) return null;
  return d.toISOString().replace("T", " ").replace("Z", "");
}

// ---------------------------------------------------------------------------
// Table names and DDL
// ---------------------------------------------------------------------------

/** MySQL table name for a collection path; subcollections become parent__child. */
export function tableNameFor(collectionPath: string): string {
  const parts = collectionPath.split("/").filter((_, i) => i % 2 === 0);
  const name = parts.join("__").replace(/[^A-Za-z0-9_]/g, "_");
  return name.slice(0, 64);
}

function generatedColumnName(field: string): string {
  return ("f_" + field.replace(/[^A-Za-z0-9_]/g, "_")).slice(0, 64);
}

function jsonPath(field: string): string {
  return '$."' + field.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
}

export function createTableSql(table: string, opts: { subcollection?: boolean } = {}): string {
  const cols = [
    "  `id` VARCHAR(255) NOT NULL",
    ...(opts.subcollection ? ["  `parent_path` VARCHAR(400) NOT NULL"] : []),
    "  `data` JSON NOT NULL",
    "  `created_at` DATETIME(3) NULL",
    "  `updated_at` DATETIME(3) NULL",
    "  `synced_at` VARCHAR(32) NOT NULL",
  ];
  const keys = [
    opts.subcollection ? "  PRIMARY KEY (`parent_path`, `id`)" : "  PRIMARY KEY (`id`)",
    "  KEY `idx_created_at` (`created_at`)",
  ];
  for (const field of INDEXED_FIELDS[table] ?? []) {
    const col = generatedColumnName(field);
    cols.push(
      `  ${escapeId(col)} VARCHAR(255) GENERATED ALWAYS AS ` +
        `(LEFT(JSON_UNQUOTE(JSON_EXTRACT(\`data\`, ${escape(jsonPath(field))})), 255)) VIRTUAL`
    );
    keys.push(`  KEY ${escapeId(("idx_" + col.slice(2)).slice(0, 64))} (${escapeId(col)})`);
  }
  return (
    `CREATE TABLE IF NOT EXISTS ${escapeId(table)} (\n` +
    [...cols, ...keys].join(",\n") +
    "\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n"
  );
}

export const AUTH_USERS_TABLE_SQL = `CREATE TABLE IF NOT EXISTS \`auth_users\` (
  \`uid\` VARCHAR(128) NOT NULL,
  \`email\` VARCHAR(320) NULL,
  \`email_verified\` TINYINT(1) NOT NULL DEFAULT 0,
  \`phone_number\` VARCHAR(32) NULL,
  \`display_name\` VARCHAR(255) NULL,
  \`photo_url\` TEXT NULL,
  \`disabled\` TINYINT(1) NOT NULL DEFAULT 0,
  \`provider_ids\` VARCHAR(255) NULL,
  \`password_hash\` TEXT NULL,
  \`password_salt\` TEXT NULL,
  \`custom_claims\` JSON NULL,
  \`created_at\` DATETIME(3) NULL,
  \`last_sign_in_at\` DATETIME(3) NULL,
  \`data\` JSON NOT NULL,
  \`synced_at\` VARCHAR(32) NOT NULL,
  PRIMARY KEY (\`uid\`),
  KEY \`idx_email\` (\`email\`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

export const STORAGE_FILES_TABLE_SQL = `CREATE TABLE IF NOT EXISTS \`storage_files\` (
  \`path\` VARCHAR(512) NOT NULL,
  \`size_bytes\` BIGINT NULL,
  \`content_type\` VARCHAR(255) NULL,
  \`md5_hash\` VARCHAR(64) NULL,
  \`created_at\` DATETIME(3) NULL,
  \`updated_at\` DATETIME(3) NULL,
  \`metadata\` JSON NOT NULL,
  \`downloaded_to\` VARCHAR(1000) NULL,
  \`synced_at\` VARCHAR(32) NOT NULL,
  PRIMARY KEY (\`path\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

// ---------------------------------------------------------------------------
// Upserts
// ---------------------------------------------------------------------------

/** Build one multi-row INSERT ... ON DUPLICATE KEY UPDATE statement. */
export function upsertSql(table: string, rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const columns = Object.keys(rows[0]);
  const values = rows.map((r) => "(" + columns.map((c) => escape((r[c] ?? null) as Parameters<typeof escape>[0])).join(", ") + ")");
  const keyCols = new Set(["id", "uid", "path", "parent_path"]);
  const updates = columns
    .filter((c) => !keyCols.has(c))
    .map((c) => `${escapeId(c)} = VALUES(${escapeId(c)})`);
  return (
    `INSERT INTO ${escapeId(table)} (${columns.map((c) => escapeId(c)).join(", ")}) VALUES\n` +
    values.join(",\n") +
    `\nON DUPLICATE KEY UPDATE ${updates.join(", ")};\n`
  );
}

export function documentRow(
  id: string,
  rawData: Record<string, unknown>,
  runId: string,
  parentPath?: string
): Record<string, unknown> {
  const data = toPlain(rawData) as { [k: string]: Plain };
  return {
    id,
    ...(parentPath !== undefined ? { parent_path: parentPath } : {}),
    data: JSON.stringify(data),
    created_at: toMysqlDatetime(data.createdAt),
    updated_at: toMysqlDatetime(data.updatedAt),
    synced_at: runId,
  };
}

/** Removes rows that were not written by this run (documents deleted in Firebase since an earlier export). */
export function pruneSql(table: string, runId: string): string {
  return `DELETE FROM ${escapeId(table)} WHERE \`synced_at\` <> ${escape(runId)};\n`;
}

// ---------------------------------------------------------------------------
// Tables used only by the website (created automatically on first use)
// ---------------------------------------------------------------------------

export const SESSIONS_TABLE_SQL = `CREATE TABLE IF NOT EXISTS \`sessions\` (
  \`token_hash\` CHAR(64) NOT NULL,
  \`uid\` VARCHAR(128) NOT NULL,
  \`anonymous\` TINYINT(1) NOT NULL DEFAULT 0,
  \`created_at\` DATETIME(3) NOT NULL,
  \`expires_at\` DATETIME(3) NOT NULL,
  PRIMARY KEY (\`token_hash\`),
  KEY \`idx_uid\` (\`uid\`),
  KEY \`idx_expires_at\` (\`expires_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

export const PASSWORD_RESETS_TABLE_SQL = `CREATE TABLE IF NOT EXISTS \`password_resets\` (
  \`token_hash\` CHAR(64) NOT NULL,
  \`uid\` VARCHAR(128) NOT NULL,
  \`created_at\` DATETIME(3) NOT NULL,
  \`expires_at\` DATETIME(3) NOT NULL,
  \`used_at\` DATETIME(3) NULL,
  PRIMARY KEY (\`token_hash\`),
  KEY \`idx_uid\` (\`uid\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

export const FILES_TABLE_SQL = `CREATE TABLE IF NOT EXISTS \`files\` (
  \`path\` VARCHAR(512) NOT NULL,
  \`content\` LONGBLOB NOT NULL,
  \`content_type\` VARCHAR(255) NOT NULL,
  \`size_bytes\` BIGINT NOT NULL,
  \`owner_uid\` VARCHAR(128) NULL,
  \`created_at\` DATETIME(3) NOT NULL,
  \`updated_at\` DATETIME(3) NOT NULL,
  PRIMARY KEY (\`path\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

/** Tables the website needs besides one-per-collection. */
export const APP_TABLES_SQL = [
  AUTH_USERS_TABLE_SQL,
  SESSIONS_TABLE_SQL,
  PASSWORD_RESETS_TABLE_SQL,
  FILES_TABLE_SQL,
];
