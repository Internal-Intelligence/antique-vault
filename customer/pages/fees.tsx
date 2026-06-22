import Layout from "../components/Layout";
import Link from "next/link";

const FEE_ROWS = [
  { name: "Standard sale", rate: "5%", note: "Applied when your item sells at fixed price or auction" },
  { name: "Promoted listing", rate: "8%", note: "Featured placement in category browse and search" },
  { name: "Paid boost (card)", rate: "From $9", note: "7–30 day promoted visibility — Stripe checkout (Sprint 1)" },
  { name: "Pawn interest", rate: "5% of interest", note: "Only on interest paid at repay; loan principal is not cut" },
  { name: "Booster affiliate", rate: "Up to 12%", note: "Share of sale paid to promoter on boosted listings only" },
];

export default function FeesPage() {
  return (
    <Layout>
      <div className="max-w-2xl">
        <h1 className="page-title">Fees & pricing</h1>
        <p className="page-subtitle mb-8">
          Transparent marketplace fees — competitive with eBay. You keep the majority of every sale.
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

        <div className="space-y-4 text-sm text-zinc-500 leading-relaxed">
          <p>
            <strong className="text-zinc-300">Example:</strong> You sell a phone for $200. At 5% standard fee, NFTBAY
            collects $10 and you receive $190. Promoted listings use an 8% fee in exchange for higher visibility.
          </p>
          <p>
            Fees are enforced on-chain at settlement. Boost packages are optional and billed separately when you choose
            promoted placement.
          </p>
        </div>

        <div className="mt-10 flex gap-3">
          <Link href="/sell" className="btn-primary">
            Start selling
          </Link>
          <Link href="/market" className="btn-secondary">
            Browse market
          </Link>
        </div>
      </div>
    </Layout>
  );
}