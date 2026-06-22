import Link from "next/link";
import { AUCTION_PREVIEWS } from "./sellPageData";

export default function SellAuctionsPreview() {
  return (
    <section className="sell-browse-section sell-auctions-section">
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="sell-browse-title">Live auctions</h2>
          <p className="sell-browse-sub">Bid in SOL — winners claim shipping within 72 hours.</p>
        </div>
        <Link href="/auctions" className="home-link-arrow text-sm">
          View all
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Link href="/?action=list&mode=auction" className="btn-primary text-sm min-h-[40px] px-5">
          Start an auction
        </Link>
        <Link href="/auctions" className="btn-secondary text-sm min-h-[40px] px-5">
          Browse live auctions
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {AUCTION_PREVIEWS.map((a) => (
          <Link key={a.id} href="/auctions" className="sell-auction-preview-card hover:border-white/20 transition-colors">
            <h3 className="sell-auction-name">{a.name}</h3>
            <div className="sell-auction-bid">${a.highBid}</div>
            <div className="flex justify-between text-xs text-zinc-500 mt-2">
              <span>{a.bids} bids</span>
              <span className="text-amber-400/80">Ends {a.endsIn}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}