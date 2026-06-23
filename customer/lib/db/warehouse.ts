import { getSql } from "./index";

export type WarehouseItemRow = {
  item_id: string;
  nft_mint: string | null;
  name: string | null;
  category: string | null;
  condition_grade: number | null;
  status: string;
  photos: unknown;
  q_hash: string | null;
  paperwork_verified: boolean;
  verified_at: string | null;
  updated_at: string;
};

export async function upsertWarehouseItem(input: {
  itemId: string;
  nftMint?: string;
  name?: string;
  category?: string;
  conditionGrade?: number;
  status?: string;
  qHash?: string;
  paperworkVerified?: boolean;
}) {
  const sql = getSql();
  await sql`
    INSERT INTO warehouse_items (item_id, nft_mint, name, category, condition_grade, status, q_hash, paperwork_verified, verified_at)
    VALUES (
      ${input.itemId},
      ${input.nftMint ?? null},
      ${input.name ?? null},
      ${input.category ?? null},
      ${input.conditionGrade ?? null},
      ${input.status ?? "intake"},
      ${input.qHash ?? null},
      ${input.paperworkVerified ?? false},
      ${input.paperworkVerified ? new Date().toISOString() : null}
    )
    ON CONFLICT (item_id) DO UPDATE SET
      nft_mint = COALESCE(EXCLUDED.nft_mint, warehouse_items.nft_mint),
      name = COALESCE(EXCLUDED.name, warehouse_items.name),
      category = COALESCE(EXCLUDED.category, warehouse_items.category),
      condition_grade = COALESCE(EXCLUDED.condition_grade, warehouse_items.condition_grade),
      status = COALESCE(EXCLUDED.status, warehouse_items.status),
      q_hash = COALESCE(EXCLUDED.q_hash, warehouse_items.q_hash),
      paperwork_verified = EXCLUDED.paperwork_verified,
      verified_at = CASE WHEN EXCLUDED.paperwork_verified THEN NOW() ELSE warehouse_items.verified_at END,
      updated_at = NOW()
  `;
}

export async function getWarehouseItem(itemId: string): Promise<WarehouseItemRow | null> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM warehouse_items WHERE item_id = ${itemId} LIMIT 1`;
  return (rows[0] as WarehouseItemRow) ?? null;
}

export async function getWarehouseByMint(nftMint: string): Promise<WarehouseItemRow | null> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM warehouse_items WHERE nft_mint = ${nftMint} LIMIT 1`;
  return (rows[0] as WarehouseItemRow) ?? null;
}