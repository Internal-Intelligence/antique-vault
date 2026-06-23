import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Link from "next/link";
import { FEE_ALLOCATION } from "../lib/mission";
import { fetchFeeAllocations } from "../lib/apiClient";

const FEE_ROWS = [
  { name: "Standard sale", rate: "5%", note: "Applied when your item sells at fixed price or auction" },
  { name: "Promoted listing", rate: "8%", note: "Featured placement in category browse and search" },
  { name: "Paid boost (card)", rate: "From $9", note: "7–30 day promoted visibility — Stripe checkout (Sprint 1)" },
  { name: "Pawn interest", rate: "5% of interest", note: "Only on interest paid at repay; loan principal is not cut" },
  { name: "Booster affiliate", rate: "Up to 12%", note: "Share of sale paid to promoter on boosted listings only" },
];

type RecordedAllocation = {
  period_label: string;
  pool_type: string;
  amount_lamports: number;
  pct: number;
  note?: string;
};

export default function FeesPage() {
  const [recorded, setRecorded] = useState<RecordedAllocation[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchFeeAllocations()
      .then((data) => {
        if (data?.recorded?.length) setRecorded(data.recorded);
      })
      .finally(() => setLoaded(true));
  }, []);

  const policy = FEE_ALLOCATION;

  return (
    <Layout>
      <div className="max-w-2xl">
        <h1 className="page-title">Fees & pricing</h1>
        <p className="page-subtitle mb-8">
          Transparent marketplace fees — you keep the majority of every sale. Fees recycle into inventory,
          incentive bids, and warehouse verification.
        </p>

        <div className="rounded-xl border border-white/[0.08] overflow-hidden mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.03]">
                <th className="text-left px-4 py-3 font-medium text-zinc-300">Service</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-300">Rate</th>
              </tr>
            </thead>
            <tbody>
              {FEE_ROWS.map((row) => (
                <tr key={row.name} className="border-b border-white/[0.06] last:border-0">
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-zinc-200">{row.name}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{row.note}</div>
                  </td>
                  <td className="px-4 py-3 text-emerald-400 font-medium whitespace-nowrap">{row.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="glass-panel glass-panel--subtle p-5 mb-8">
          <h2 className="text-base font-semibold text-zinc-100 mb-1">Where fees go</h2>
          <p className="text-sm text-zinc-500 mb-5 leading-relaxed">
            On-chain settlement collects platform fees. The allocation below is how NFTBAY reinvests them —
            deflationary deals through vault inventory, plus transparent incentive bids on standout listings.
          </p>
          <ul className="space-y-3">
            {policy.map((row) => (
              <li key={row.label} className="flex gap-3 text-sm">
                <span className="text-lg shrink-0" aria-hidden>
                  {row.icon}
                </span>
                <div>
                  <span className="font-medium text-zinc-200">
                    {row.pct}% · {row.label}
                  </span>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{row.desc}</p>
                </div>
              </li>
            ))}
          </ul>
          {loaded && recorded.length > 0 && (
            <div className="mt-6 pt-5 border-t border-white/[0.06]">
              <h3 className="text-sm font-medium text-zinc-300 mb-3">Recorded allocations (Postgres)</h3>
              <ul className="space-y-2 text-xs text-zinc-500">
                {recorded.map((row, i) => (
                  <li key={`${row.period_label}-${row.pool_type}-${i}`}>
                    {row.period_label} · {row.pool_type}: {(row.amount_lamports / 1e9).toFixed(4)} SOL ({row.pct}%)
                    {row.note ? ` — ${row.note}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Link href="/mission" className="text-sm text-emerald-500/90 hover:underline mt-5 inline-block">
            Read the full mission →
          </Link>
        </section>

        <div className="space-y-4 text-sm text-zinc-500 leading-relaxed">
          <p>
            <strong className="text-zinc-300">Example:</strong> You sell a phone for $200. At 5% standard fee, NFTBAY
            collects $10 and you receive $190. A portion of that $10 funds vault acquisitions and the incentive bid
            pool that supports real demand on quality tech, jewelry, and card listings.
          </p>
          <p>
            Fees are enforced on-chain at settlement. Boost packages are optional and billed separately when you choose
            promoted placement.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/sell" className="btn-primary">
            Start selling
          </Link>
          <Link href="/warehouse" className="btn-secondary">
            Verification hub
          </Link>
          <Link href="/market" className="btn-secondary">
            Browse market
          </Link>
        </div>
      </div>
    </Layout>
  );
}