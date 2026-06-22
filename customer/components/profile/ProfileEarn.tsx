import Link from "next/link";
import type { EarningsSnapshot } from "./types";

interface ProfileEarnProps {
  earnings: EarningsSnapshot;
  onWithdraw: () => void;
}

function EarnRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="profile-earn-row">
      <div>
        <p className="profile-earn-row__label">{label}</p>
        {note && <p className="profile-earn-row__note">{note}</p>}
      </div>
      <p className="profile-earn-row__value">{value}</p>
    </div>
  );
}

export default function ProfileEarn({ earnings, onWithdraw }: ProfileEarnProps) {
  const fmt = (n: number) =>
    `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="profile-earn">
      <section className="profile-earn-hero">
        <div>
          <p className="profile-card__eyebrow">Available balance</p>
          <p className="profile-earn-hero__amount">{fmt(earnings.pendingPayout)}</p>
          <p className="profile-earn-hero__sub">
            {fmt(earnings.totalEarned)} lifetime · fees paid {fmt(earnings.feesPaid)}
          </p>
        </div>
        <button type="button" onClick={onWithdraw} className="btn-primary shrink-0">
          Withdraw
        </button>
      </section>

      <section className="profile-card">
        <h2 className="profile-card__title mb-4">Revenue breakdown</h2>
        <div className="profile-earn-breakdown">
          <EarnRow label="Marketplace sales" value={fmt(earnings.totalEarned * 0.72)} note="Net after 5–8% platform fee" />
          <EarnRow label="Boost affiliate" value={fmt(earnings.affiliateShare)} note="Share of promoted listing sales" />
          <EarnRow label="Promoter boost pool" value={fmt(earnings.boostRevenue)} note="When others boost your listings" />
          <EarnRow label="Shop revenue" value={fmt(earnings.shopRevenue)} note="Storefront — coming in Grow tab" />
        </div>
      </section>

      <section className="profile-card">
        <h2 className="profile-card__title mb-2">Payout settings</h2>
        <p className="profile-card__body mb-4">
          Payouts settle to your connected Solana wallet. Card-based boost purchases bill separately via Stripe.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/fees" className="btn-secondary text-sm">
            View fees
          </Link>
          <button type="button" className="btn-secondary text-sm opacity-60 cursor-not-allowed" disabled>
            Add payout email (soon)
          </button>
        </div>
      </section>
    </div>
  );
}