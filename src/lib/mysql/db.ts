// MySQL access for the GoDaddy-hosted database.
//
// GoDaddy's Node.js hosting injects DB_HOST, DB_PORT, DB_NAME, DB_USER and
// DB_PASSWORD automatically when a hosted database is attached to the app,
// so nothing needs to be configured here or committed to the repo.
//
// Server-side only: import this from route handlers, server components or
// server actions — never from a "use client" file, or the driver (and the
// credentials) would be pulled into the browser bundle.
//
// Following GoDaddy's guidance, each query opens a short-lived connection
// and always closes it in a finally block.

import mysql from "mysql2/promise";

export function isMysqlConfigured(): boolean {
  return Boolean(
    process.env.DB_HOST &&
      process.env.DB_USER &&
      process.env.DB_NAME
  );
}

function getConnectionOptions(): mysql.ConnectionOptions {
  if (!isMysqlConfigured()) {
    throw new Error(
      "MySQL is not configured: DB_HOST, DB_USER and DB_NAME must be set " +
        "(GoDaddy sets them automatically when a hosted database is attached)."
    );
  }
  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: "utf8mb4",
    // Store and read DATETIME values as UTC.
    timezone: "Z",
    dateStrings: true,
  };
}

/**
 * Run one SQL statement and return its rows.
 * Always pass user input through `params` (placeholders `?`), never by
 * string concatenation, to avoid SQL injection.
 */
export async function query<T = unknown>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const connection = await mysql.createConnection(getConnectionOptions());
  try {
    const [rows] = await connection.query(sql, params);
    return rows as T[];
  } finally {
    await connection.end();
  }
}

export type Db = mysql.Connection;

/**
 * Open one short-lived connection for a whole request, run `fn` with it and
 * always close it. Use this when a request makes several queries.
 */
export async function withConnection<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  const connection = await mysql.createConnection(getConnectionOptions());
  try {
    await connection.query("SET time_zone = '+00:00'");
    return await fn(connection);
  } finally {
    await connection.end();
  }
}

/** Run `fn` inside a transaction: everything is saved, or nothing is. */
export async function inTransaction<T>(db: Db, fn: () => Promise<T>): Promise<T> {
  await db.beginTransaction();
  try {
    const result = await fn();
    await db.commit();
    return result;
  } catch (err) {
    await db.rollback().catch(() => {});
    throw err;
  }
}
