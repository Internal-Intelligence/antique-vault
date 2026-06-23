import type { NextApiRequest, NextApiResponse } from "next";
import { ensureSchema } from "../../../lib/db/migrate";
import { hasDatabase } from "../../../lib/db";
import { requireCronAuth, requireMethod } from "../../../lib/server/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ["POST"])) return;
  if (!requireCronAuth(req, res)) return;

  if (!hasDatabase()) {
    return res.status(503).json({ error: "POSTGRES_URL not set" });
  }

  try {
    await ensureSchema();
    return res.status(200).json({ ok: true, message: "Schema applied" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Migration failed";
    return res.status(500).json({ error: msg });
  }
}