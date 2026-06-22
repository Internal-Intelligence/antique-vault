import Link from "next/link";
import { motion } from "framer-motion";

const AUCTIONS = [
  { id: "A1", name: "DJI Mini 4 Pro Fly More", current: "$412", bids: 7, ends: "2h 14m", hot: true },
  { id: "A2", name: "Steam Deck OLED 1TB", current: "$489", bids: 12, ends: "4h 02m", hot: false },
  { id: "A3", name: "Vintage Seiko 6139", current: "$318", bids: 19, ends: "38m", hot: true },
];

export default function HomeAuctionStrip() {
  return (
    <section className="mb-12">
      <div className="flex items-end justify-between gap-4 mb-5 px-0.5">
        <div>
          <h2 className="home-section-title">Live auctions ending soon</h2>
          <p className="home-section-sub">Bid now — settlement runs on-chain with standard marketplace fees.</p>
        </div>
        <Link href="/market#auctions" className="home-link-arrow shrink-0">
          All auctions
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {AUCTIONS.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
          >
            <Link href="/market#auctions" className="home-auction-card">
              <div className="flex items-start justify-between gap-2">
                <h3 className="home-auction-name">{a.name}</h3>
                {a.hot && <span className="home-pill home-pill--live text-[10px] py-0.5">HOT</span>}
              </div>
              <div className="home-auction-bid">{a.current}</div>
              <div className="flex items-center justify-between text-xs text-zinc-500 mt-3">
                <span>{a.bids} bids</span>
                <span className="text-amber-400/90 font-medium tabular-nums">Ends {a.ends}</span>
              </div>
              <div className="home-auction-bar mt-3">
                <div className="home-auction-bar-fill" style={{ width: `${55 + i * 12}%` }} />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}