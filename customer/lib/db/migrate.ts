import { Pool } from "@neondatabase/serverless";
import { hasDatabase } from "./index";
import { SCHEMA_SQL } from "./schema";

let migrated = false;

export async function ensureSchema(): Promise<boolean> {
  if (migrated) return true;
  if (!hasDatabase()) return false;

  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!url) return false;

  const pool = new Pool({ connectionString: url });
  const statements = SCHEMA_SQL.split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  try {
    for (const statement of statements) {
      await pool.query(statement);
    }
  } finally {
    await pool.end();
  }

  migrated = true;
  return true;
}