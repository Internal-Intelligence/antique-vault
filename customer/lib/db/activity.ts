import { getSql } from "./index";
import { newId } from "./ids";

export async function logActivity(input: {
  walletPubkey: string;
  eventType: string;
  title: string;
  meta?: string;
  valueText?: string;
  refId?: string;
}) {
  const sql = getSql();
  const id = newId("ACT");
  await sql`
    INSERT INTO activity_events (id, wallet_pubkey, event_type, title, meta, value_text, ref_id)
    VALUES (
      ${id},
      ${input.walletPubkey},
      ${input.eventType},
      ${input.title},
      ${input.meta ?? null},
      ${input.valueText ?? null},
      ${input.refId ?? null}
    )
  `;
}

export async function getActivityForWallet(walletPubkey: string, limit = 20) {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM activity_events
    WHERE wallet_pubkey = ${walletPubkey}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows;
}