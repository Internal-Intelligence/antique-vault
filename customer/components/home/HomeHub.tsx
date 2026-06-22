import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { HERO_ROTATIONS, HUB_BUBBLES } from "./data";
import HomeSearch from "./HomeSearch";

export default function HomeHub() {
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPhraseIdx((i) => (i + 1) % HERO_ROTATIONS.length), 3400);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="home-hub mb-10">
      <div className="home-hub-ambient" aria-hidden>
        <span className="home-hub-orb home-hub-orb--emerald" />
        <span className="home-hub-orb home-hub-orb--violet" />
        <span className="home-hub-orb home-hub-orb--amber" />
      </div>

      <div className="home-hub-shell glass-panel">
        <div className="home-hub-top">
          <div className="flex flex-wrap items-center gap-2">
            <span className="home-pill home-pill--live home-pill--pulse">Live marketplace</span>
            <span className="home-pill">Keep 92%+ after fees</span>
            <span className="home-pill home-pill--rose">Vault-backed every item</span>
          </div>

          <h1 className="home-hero-title max-w-3xl mt-6">
            Find your next{" "}
            <span className="home-hero-accent home-hero-accent--warm">win</span>
            <br className="hidden sm:block" />
            {" "}— real gear, real payouts
          </h1>

          <p className="home-hero-sub max-w-2xl mt-4">
            The thrill of scoring a deal. The rush of selling in minutes. NFTBAY is where collectors,
            flippers, and everyday shoppers hunt vault-backed goods with instant SOL — no crypto PhD required.
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
                ↳ {HERO_ROTATIONS[phraseIdx]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="home-hub-core glass-panel glass-panel--inner mt-8">
          <p className="home-hub-core-label">Start here</p>
          <HomeSearch large glass hub />

          <div className="home-bubble-grid mt-6">
            {HUB_BUBBLES.map((bubble, i) => (
              <motion.div
                key={bubble.id}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.08 + i * 0.05, duration: 0.4, type: "spring", stiffness: 260, damping: 22 }}
              >
                <Link href={bubble.href} className={`glass-bubble glass-bubble--${bubble.tone}`}>
                  <span className="glass-bubble-icon" aria-hidden>
                    {bubble.icon}
                  </span>
                  <span className="glass-bubble-text">
                    <span className="glass-bubble-label">{bubble.label}</span>
                    <span className="glass-bubble-tag">{bubble.tagline}</span>
                  </span>
                  <span className="glass-bubble-shine" aria-hidden />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="home-hub-footer mt-6 flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3">
          <Link href="/market" className="glass-cta glass-cta--primary">
            Explore trending deals
          </Link>
          <Link href="/profile" className="glass-cta glass-cta--ghost">
            Your command center →
          </Link>
          <p className="text-xs text-zinc-500 sm:ml-auto">
            <span className="text-rose-300/80">♥</span> Trusted by hunters &amp; sellers alike
          </p>
        </div>
      </div>
    </section>
  );
}