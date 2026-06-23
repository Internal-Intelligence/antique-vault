import type { NextApiRequest, NextApiResponse } from "next";
import { getSql } from "../../../lib/db";
import { newId } from "../../../lib/db/ids";
import { logActivity } from "../../../lib/db/activity";
import { withDb } from "../../../lib/server/api";
import { requireMethod } from "../../../lib/server/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ["POST", "GET"])) return;

  await withDb(req, res, async () => {
    const sql = getSql();

    if (req.method === "GET") {
      const wallet = typeof req.query.wallet === "string" ? req.query.wallet : null;
      if (!wallet) return res.status(400).json({ error: "wallet query required" });
      const rows = await sql`
        SELECT * FROM verify_sessions WHERE wallet_pubkey = ${wallet}
        ORDER BY created_at DESC LIMIT 1
      `;
      return res.status(200).json({ ok: true, session: rows[0] ?? null });
    }

    const { walletPubkey, provider = "persona" } = req.body ?? {};
    if (!walletPubkey) return res.status(400).json({ error: "walletPubkey required" });

    const personaKey = process.env.PERSONA_API_KEY;
    const id = newId("VID");
    let externalId: string | null = null;
    let status = "pending";
    let trustScore: number | null = null;

    if (personaKey) {
      try {
        const resp = await fetch("https://withpersona.com/api/v1/inquiries", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${personaKey}`,
            "Content-Type": "application/json",
            "Persona-Version": "2023-01-05",
          },
          body: JSON.stringify({
            data: {
              attributes: {
                "reference-id": String(walletPubkey),
              },
            },
          }),
        });
        const data = await resp.json();
        externalId = data?.data?.id ?? null;
        status = "created";
      } catch (e) {
        console.warn("[verify] Persona create failed", e);
      }
    } else {
      status = "demo_verified";
      trustScore = 88;
    }

    await sql`
      INSERT INTO verify_sessions (id, wallet_pubkey, provider, external_id, status, trust_score)
      VALUES (${id}, ${String(walletPubkey)}, ${String(provider)}, ${externalId}, ${status}, ${trustScore})
    `;

    if (status === "demo_verified") {
      await logActivity({
        walletPubkey: String(walletPubkey),
        eventType: "verify",
        title: "Identity verified (demo)",
        meta: "Full Persona KYC when PERSONA_API_KEY is set",
        refId: id,
      });
    }

    return res.status(200).json({
      ok: true,
      sessionId: id,
      status,
      trustScore,
      externalId,
      demo: !personaKey,
    });
  });
}