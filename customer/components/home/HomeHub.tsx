import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { HERO_ROTATIONS, HUB_BUBBLES } from "./data";
import HomeSearch from "./HomeSearch";
import { childScaleIn, softTransition, staggerContainer } from "./motion";

export default function HomeHub() {
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPhraseIdx((i) => (i + 1) % HERO_ROTATIONS.length), 3400);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.section
      className="home-hub mb-10"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={softTransition(0.75)}
    >
      <div className="home-hub-ambient" aria-hidden>
        <span className="home-hub-orb home-hub-orb--emerald" />
        <span className="home-hub-orb home-hub-orb--violet" />
        <span className="home-hub-orb home-hub-orb--amber" />
      </div>

      <motion.div
        className="home-hub-shell glass-panel"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={softTransition(0.65, 0.12)}
      >
        <motion.div
          className="home-hub-top"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={softTransition(0.55, 0.2)}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="home-pill home-pill--live home-pill--pulse">Live marketplace</span>
            <span className="home-pill">Keep 92%+ after fees</span>
            <span className="home-pill home-pill--rose">Vault-backed every item</span>
          </div>

          <h1 className="home-hero-title max-w-3xl mt-6">
            <span className="home-hero-brand">NFTBAY</span>
            <br className="hidden sm:block" />
            {" "}— real gear in,{" "}
            <span className="home-hero-accent home-hero-accent--warm">real SOL out</span>
          </h1>

          <p className="home-hero-sub max-w-2xl mt-4">
            The marketplace that sticks with you: vault-backed phones, laptops &amp; collectibles —
            buy, bid, sell, and get paid on Solana without the crypto headache.
          </p>

          <div className="h-7 mt-3 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={phraseIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={softTransition(0.4)}
                className="text-sm font-medium text-emerald-400/90"
              >
                ↳ {HERO_ROTATIONS[phraseIdx]}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div
          className="home-hub-core glass-panel glass-panel--inner mt-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={softTransition(0.6, 0.28)}
        >
          <p className="home-hub-core-label">Start here</p>
          <HomeSearch large glass hub />

          <motion.div
            className="home-bubble-grid mt-6"
            variants={staggerContainer(0.06, 0.35)}
            initial="hidden"
            animate="visible"
          >
            {HUB_BUBBLES.map((bubble) => (
              <motion.div key={bubble.id} variants={childScaleIn}>
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
          </motion.div>
        </motion.div>

        <motion.div
          className="home-hub-footer mt-6 flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={softTransition(0.5, 0.45)}
        >
          <Link href="/market" className="glass-cta glass-cta--primary">
            Explore trending deals
          </Link>
          <Link href="/profile" className="glass-cta glass-cta--ghost">
            Your command center →
          </Link>
          <p className="text-xs text-zinc-500 sm:ml-auto">
            <span className="text-rose-300/80">♥</span> Trusted by hunters &amp; sellers alike
          </p>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}