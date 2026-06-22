import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { HERO_ROTATIONS } from "./data";
import HomeSearch from "./HomeSearch";

export default function HomeHero() {
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPhraseIdx((i) => (i + 1) % HERO_ROTATIONS.length), 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="home-hero relative overflow-hidden rounded-[28px] border border-white/[0.08] mb-10">
      <div className="home-hero-glow" aria-hidden />
      <div className="relative z-10 px-5 sm:px-8 lg:px-10 py-10 sm:py-14 lg:py-16">
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="home-pill home-pill--live">Live on Solana devnet</span>
          <span className="home-pill">5% standard · 8% promoted</span>
          <span className="home-pill home-pill--blue">Vault-backed RWA</span>
        </div>

        <h1 className="home-hero-title max-w-3xl">
          The marketplace for{" "}
          <span className="home-hero-accent">real things</span>
          <br className="hidden sm:block" />
          {" "}— buy, sell &amp; earn on-chain
        </h1>

        <p className="home-hero-sub max-w-2xl mt-4">
          NFTBAY is eBay rebuilt for crypto and normies alike. Tokenized inventory, insured vault custody,
          instant SOL payouts, and auctions that actually feel alive.
        </p>

        <div className="h-7 mt-3 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={phraseIdx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="text-sm font-medium text-emerald-400/90"
            >
              ↳ Shop {HERO_ROTATIONS[phraseIdx]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="mt-8 max-w-2xl">
          <HomeSearch large />
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-6">
          <Link href="/market" className="btn-primary min-w-[140px]">
            Explore deals
          </Link>
          <Link href="/sell" className="btn-secondary min-w-[140px]">
            Sell in 60 seconds
          </Link>
          <Link href="/profile" className="home-ghost-btn">
            Your command center →
          </Link>
        </div>
      </div>
    </section>
  );
}