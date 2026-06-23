import { getSql } from "./index";
import { FEE_ALLOCATION } from "../mission";
import { newId } from "./ids";

export async function seedFeeAllocationsIfEmpty() {
  const sql = getSql();
  const existing = await sql`SELECT COUNT(*)::int AS c FROM fee_allocations`;
  if ((existing[0] as { c: number }).c > 0) return;

  const period = new Date().toISOString().slice(0, 7);
  for (const row of FEE_ALLOCATION) {
    await sql`
      INSERT INTO fee_allocations (id, period_label, pool_type, amount_lamports, pct, note)
      VALUES (${newId("FEE")}, ${period}, ${row.label}, ${0}, ${row.pct}, ${row.desc})
    `;
  }
}

export async function getFeeAllocations() {
  const sql = getSql();
  await seedFeeAllocationsIfEmpty();
  const rows = await sql`
    SELECT pool_type, pct, note, SUM(amount_lamports)::bigint AS total_lamports
    FROM fee_allocations
    GROUP BY pool_type, pct, note
    ORDER BY pct DESC
  `;
  return rows;
}

export async function recordFeeEvent(poolType: string, amountLamports: number, note?: string) {
  const sql = getSql();
  const period = new Date().toISOString().slice(0, 7);
  const match = FEE_ALLOCATION.find((f) => f.label === poolType);
  await sql`
    INSERT INTO fee_allocations (id, period_label, pool_type, amount_lamports, pct, note)
    VALUES (${newId("FEE")}, ${period}, ${poolType}, ${amountLamports}, ${match?.pct ?? 0}, ${note ?? null})
  `;
}