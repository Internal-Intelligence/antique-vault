import Link from "next/link";
import { motion } from "framer-motion";
import HomeSectionReveal from "./HomeSectionReveal";
import { childFadeUp, softTransition, staggerContainer } from "./motion";

export default function HomeSellerBand() {
  return (
    <HomeSectionReveal className="home-seller-band glass-panel mb-12" variant="slideLeft">
      <div className="home-seller-band-inner">
          <motion.div
            className="max-w-xl"
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={softTransition(0.6)}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400/80 mb-2">
              Sell with confidence
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
              Turn unused gear into SOL
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-6">
              List in minutes with AI pricing guidance, vault custody, and clear fee breakdowns.
              Keep more than legacy marketplaces — without the pressure tactics.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/sell" className="btn-primary">
                Start selling
              </Link>
              <Link href="/fees" className="btn-secondary">
                See fee breakdown
              </Link>
              <Link href="/acquire" className="home-ghost-btn">
                Fund inventory rounds
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="home-seller-metrics"
            variants={staggerContainer(0.1, 0.15)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
          >
            {[
              { value: "5%", label: "standard fee", tone: "text-emerald-400" },
              { value: "8%", label: "promoted max", tone: "text-amber-400" },
              { value: "∞", label: "categories", tone: "text-white" },
            ].map((m) => (
              <motion.div key={m.label} variants={childFadeUp}>
                <div className={`text-3xl font-bold tabular-nums ${m.tone}`}>{m.value}</div>
                <div className="text-xs text-zinc-500">{m.label}</div>
              </motion.div>
            ))}
          </motion.div>
      </div>
    </HomeSectionReveal>
  );
}