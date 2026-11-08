// Health check for the GoDaddy-hosted MySQL database.
// Visit /api/db-health after deploying: {"ok":true,...} means the app can
// reach the database. No credentials are ever included in the response.

import { isMysqlConfigured, query } from "@/lib/mysql/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isMysqlConfigured()) {
    return Response.json(
      {
        ok: false,
        error:
          "Database variables are not set. Attach the hosted database to this app in GoDaddy.",
      },
      { status: 503 }
    );
  }

  try {
    const rows = await query<{ db: string; server_time: string; version: string }>(
      "SELECT DATABASE() AS db, NOW() AS server_time, VERSION() AS version"
    );
    return Response.json({ ok: true, ...rows[0] });
  } catch (error) {
    console.error("[db-health] MySQL connection failed:", error);
    return Response.json(
      { ok: false, error: "Could not connect to the database. Check the app logs." },
      { status: 500 }
    );
  }
}
