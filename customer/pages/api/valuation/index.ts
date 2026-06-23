import type { NextApiRequest, NextApiResponse } from "next";
import { getSql } from "../../../lib/db";
import { newId } from "../../../lib/db/ids";
import { computeQuantumValuation } from "../../../lib/sell/valuation";
import type { PawnForm } from "../../../lib/sell";
import { withDb } from "../../../lib/server/api";
import { requireMethod } from "../../../lib/server/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ["POST"])) return;

  await withDb(req, res, async () => {
    const body = req.body ?? {};
    const form: PawnForm = {
      deviceName: String(body.deviceName ?? ""),
      category: String(body.category ?? "Other E-Waste"),
      isWorking: body.isWorking ?? true,
      deviceStatusChosen: true,
      hasIssues: body.hasIssues ?? null,
      issuesNote: String(body.issuesNote ?? ""),
      condition: Number(body.condition ?? 3),
      weightLbs: String(body.weightLbs ?? "2.8"),
      description: String(body.description ?? ""),
    };

    const valuation = computeQuantumValuation(form);
    const sql = getSql();
    const id = newId("VAL");
    const walletPubkey = body.walletPubkey ?? null;

    await sql`
      INSERT INTO valuations (id, wallet_pubkey, form_json, result_json)
      VALUES (${id}, ${walletPubkey}, ${JSON.stringify(form)}::jsonb, ${JSON.stringify(valuation)}::jsonb)
    `;

    return res.status(200).json({ ok: true, id, valuation });
  });
}