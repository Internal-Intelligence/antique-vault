import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let _sql: NeonQueryFunction<false, false> | null = null;

/** Lazy Neon client — Vercel Postgres marketplace sets POSTGRES_URL. */
export function getSql(): NeonQueryFunction<false, false> {
  if (_sql) return _sql;
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error("POSTGRES_URL is not set — add Vercel Postgres (Neon) to the project.");
  }
  _sql = neon(url);
  return _sql;
}

export function hasDatabase(): boolean {
  return !!(process.env.POSTGRES_URL || process.env.DATABASE_URL);
}