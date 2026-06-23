import { getSql } from "./index";
import { newId } from "./ids";

export type IntakeTicket = {
  id: string;
  wallet_pubkey: string | null;
  sell_mode: string;
  device_name: string;
  category: string;
  condition_tier: number;
  is_working: boolean;
  weight_lbs: string | null;
  description: string | null;
  offer_usd_cents: number;
  ship_from_address: string | null;
  warehouse_address: string;
  tracking_id: string | null;
  status: string;
  nft_mint: string | null;
  form_json: unknown;
  created_at: string;
  updated_at: string;
};

export type CreateIntakeInput = {
  walletPubkey?: string;
  sellMode?: string;
  deviceName: string;
  category: string;
  conditionTier?: number;
  isWorking?: boolean;
  weightLbs?: string;
  description?: string;
  offerUsdCents: number;
  shipFromAddress?: string;
  formJson?: unknown;
};

export async function createIntakeTicket(input: CreateIntakeInput): Promise<IntakeTicket> {
  const sql = getSql();
  const id = newId("INT");
  const trackingId = `NFTBAY-${id.slice(-8)}`;

  const rows = await sql`
    INSERT INTO intake_tickets (
      id, wallet_pubkey, sell_mode, device_name, category, condition_tier,
      is_working, weight_lbs, description, offer_usd_cents, ship_from_address,
      tracking_id, status, form_json
    ) VALUES (
      ${id},
      ${input.walletPubkey ?? null},
      ${input.sellMode ?? "intake"},
      ${input.deviceName},
      ${input.category},
      ${input.conditionTier ?? 3},
      ${input.isWorking ?? true},
      ${input.weightLbs ?? null},
      ${input.description ?? null},
      ${input.offerUsdCents},
      ${input.shipFromAddress ?? null},
      ${trackingId},
      'pending',
      ${JSON.stringify(input.formJson ?? {})}::jsonb
    )
    RETURNING *
  `;

  return rows[0] as IntakeTicket;
}

export async function getIntakeTicket(id: string): Promise<IntakeTicket | null> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM intake_tickets WHERE id = ${id} LIMIT 1`;
  return (rows[0] as IntakeTicket) ?? null;
}

export async function updateIntakeStatus(id: string, status: string, extra?: { nft_mint?: string }) {
  const sql = getSql();
  await sql`
    UPDATE intake_tickets
    SET status = ${status},
        nft_mint = COALESCE(${extra?.nft_mint ?? null}, nft_mint),
        updated_at = NOW()
    WHERE id = ${id}
  `;
}