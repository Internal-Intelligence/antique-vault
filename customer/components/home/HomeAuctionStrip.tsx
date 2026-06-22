import Link from "next/link";
import { motion } from "framer-motion";
import HomeSectionReveal, { HomeSectionHeader } from "./HomeSectionReveal";
import { childFadeUp, staggerContainer } from "./motion";

const AUCTIONS = [
  { id: "A1", name: "DJI Mini 4 Pro Fly More", current: "$412", bids: 7, ends: "2h 14m", hot: true },
  { id: "A2", name: "Steam Deck OLED 1TB", current: "$489", bids: 12, ends: "4h 02m", hot: false },
  { id: "A3", name: "Vintage Seiko 6139", current: "$318", bids: 19, ends: "38m", hot: true },
];

export default function HomeAuctionStrip() {
  return (
    <HomeSectionReveal className="mb-12" variant="fadeUp">
      <HomeSectionHeader className="flex items-end justify-between gap-4 mb-5 px-0.5">
        <div>
          <h2 className="home-section-title">Auctions heating up</h2>
          <p className="home-section-sub">The clock&apos;s running — one bid could be your story tonight.</p>
        </div>
        <Link href="/auctions" className="home-link-arrow shrink-0">
          All auctions
        </Link>
      </HomeSectionHeader>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        variants={staggerContainer(0.08)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
      >
        {AUCTIONS.map((a, i) => (
          <motion.div key={a.id} variants={childFadeUp}>
            <Link href="/auctions" className="home-auction-card glass-panel glass-panel--card">
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
      </motion.div>
    </HomeSectionReveal>
  );
}