import Link from "next/link";
import { AUCTION_PREVIEWS } from "./sellPageData";

export default function SellAuctionsPreview() {
  return (
    <section className="sell-browse-section sell-auctions-section">
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="sell-browse-title">Live auctions</h2>
          <p className="sell-browse-sub">Bid on vault-backed goods — settlement on-chain.</p>
        </div>
        <span className="sell-soon-badge">Coming soon</span>
      </div>

      <div className="sell-auctions-wrap">
        <div className="sell-auctions-blur">
          {AUCTION_PREVIEWS.map((a) => (
            <div key={a.id} className="sell-auction-preview-card">
              <h3 className="sell-auction-name">{a.name}</h3>
              <div className="sell-auction-bid">${a.highBid}</div>
              <div className="flex justify-between text-xs text-zinc-500 mt-2">
                <span>{a.bids} bids</span>
                <span className="text-amber-400/80">Ends {a.endsIn}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="sell-auctions-overlay">
          <div className="sell-auctions-overlay-inner">
            <span className="text-3xl mb-2">🏛️</span>
            <h3 className="text-lg font-semibold text-white mb-1">Live bidding launches soon</h3>
            <p className="text-sm text-zinc-400 max-w-xs mx-auto mb-4">
              List now with fixed price. Auctions &amp; real-time bids are rolling out next — get your inventory in early.
            </p>
            <Link href="/market#auctions" className="btn-secondary text-sm min-h-[40px] px-5">
              Preview on market
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}