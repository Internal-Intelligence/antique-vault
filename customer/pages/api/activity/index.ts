import type { NextApiRequest, NextApiResponse } from "next";
import { getActivityForWallet } from "../../../lib/db/activity";
import { withDb } from "../../../lib/server/api";
import { requireMethod } from "../../../lib/server/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ["GET"])) return;

  const wallet = typeof req.query.wallet === "string" ? req.query.wallet : null;
  if (!wallet) return res.status(400).json({ error: "wallet query required" });

  await withDb(req, res, async () => {
    const events = await getActivityForWallet(wallet, 25);
    return res.status(200).json({ ok: true, events });
  });
}