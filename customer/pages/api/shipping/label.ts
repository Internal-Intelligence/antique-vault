import type { NextApiRequest, NextApiResponse } from "next";
import { getSql } from "../../../lib/db";
import { newId } from "../../../lib/db/ids";
import { getIntakeTicket, updateIntakeStatus } from "../../../lib/db/intake";
import { withDb } from "../../../lib/server/api";
import { requireMethod } from "../../../lib/server/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ["POST"])) return;

  await withDb(req, res, async () => {
    const { intakeId, shipFromAddress, walletPubkey } = req.body ?? {};
    if (!intakeId) return res.status(400).json({ error: "intakeId required" });
    if (!shipFromAddress) return res.status(400).json({ error: "shipFromAddress required" });

    const ticket = await getIntakeTicket(String(intakeId));
    if (!ticket) return res.status(404).json({ error: "Intake not found" });

    const shippoKey = process.env.SHIPPO_API_KEY;
    const tracking = ticket.tracking_id || `NFTBAY-${String(intakeId).slice(-8)}`;
    let labelUrl: string | null = null;
    let carrier = "NFTBAY Demo";

    if (shippoKey) {
      try {
        const resp = await fetch("https://api.goshippo.com/transactions/", {
          method: "POST",
          headers: {
            Authorization: `ShippoToken ${shippoKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rate: req.body.rateId,
            label_file_type: "PDF",
            async: false,
          }),
        });
        const data = await resp.json();
        if (data.label_url) {
          labelUrl = data.label_url;
          carrier = data.provider ?? "Shippo";
        }
      } catch (e) {
        console.warn("[shipping] Shippo failed, using demo label", e);
      }
    }

    const sql = getSql();
    const shipId = newId("SHIP");
    await sql`
      INSERT INTO shipments (id, intake_id, wallet_pubkey, carrier, tracking, label_url, status, events)
      VALUES (
        ${shipId},
        ${String(intakeId)},
        ${walletPubkey ?? ticket.wallet_pubkey},
        ${carrier},
        ${tracking},
        ${labelUrl},
        'label_created',
        ${JSON.stringify([{ at: new Date().toISOString(), status: "label_created" }])}::jsonb
      )
    `;

    await updateIntakeStatus(String(intakeId), "label_created");

    return res.status(200).json({
      ok: true,
      shipmentId: shipId,
      tracking,
      labelUrl,
      carrier,
      demo: !shippoKey,
      shipTo: ticket.warehouse_address,
    });
  });
}