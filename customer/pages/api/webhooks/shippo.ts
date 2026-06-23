import type { NextApiRequest, NextApiResponse } from "next";
import { getSql } from "../../../lib/db";
import { ensureSchema } from "../../../lib/db/migrate";
import { hasDatabase } from "../../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!hasDatabase()) return res.status(503).json({ error: "Database not configured" });
  await ensureSchema();

  const body = req.body ?? {};
  const tracking = body.data?.tracking_number ?? body.tracking_number;
  const status = body.data?.tracking_status?.status ?? body.status ?? "updated";

  if (tracking) {
    const sql = getSql();
    await sql`
      UPDATE shipments
      SET status = ${String(status)},
          events = events || ${JSON.stringify([{ at: new Date().toISOString(), status }])}::jsonb,
          updated_at = NOW()
      WHERE tracking = ${String(tracking)}
    `;
  }

  return res.status(200).json({ received: true });
}