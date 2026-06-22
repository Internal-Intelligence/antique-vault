import Link from "next/link";
import { FEE_ALLOCATION } from "../../lib/mission";

export default function AuctionMissionBand() {
  const incentive = FEE_ALLOCATION.find((r) => r.label === "Incentive bid pool");
  const warehouse = FEE_ALLOCATION.find((r) => r.label === "Verification & warehouse");

  return (
    <section className="auctions-mission-band glass-panel glass-panel--subtle">
      <div className="auctions-mission-band__copy">
        <p className="mission-kicker">Mission v.3</p>
        <h2 className="auctions-mission-band__title">
          Fees fund real liquidity — not manufactured urgency
        </h2>
        <p className="auctions-mission-band__sub">
          {incentive?.pct}% of marketplace fees power the NFTBAY incentive bid pool. The bot places minimum
          competitive bids on standout vault-verified listings — labeled clearly, never against itself.{" "}
          {warehouse?.pct}% keeps every item scanned and insured at the verification hub before it trades.
        </p>
      </div>
      <div className="auctions-mission-band__actions">
        <Link href="/mission" className="btn-secondary text-sm min-h-[40px] px-4">
          Full mission
        </Link>
        <Link href="/warehouse" className="home-ghost-btn min-h-[40px] px-2">
          Verification hub →
        </Link>
      </div>
    </section>
  );
}