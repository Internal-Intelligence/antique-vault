import type { NextApiRequest, NextApiResponse } from "next";
import { ensureSchema } from "../db/migrate";
import { hasDatabase } from "../db";

export async function withDb(
  req: NextApiRequest,
  res: NextApiResponse,
  handler: () => Promise<void>
) {
  try {
    if (!hasDatabase()) {
      return res.status(503).json({
        error: "Database not configured",
        hint: "Add Vercel Postgres to the project and set POSTGRES_URL",
      });
    }
    await ensureSchema();
    await handler();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    console.error("[API]", msg, err);
    res.status(500).json({ error: msg });
  }
}