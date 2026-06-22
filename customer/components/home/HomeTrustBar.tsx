import { motion } from "framer-motion";
import { HOME_STATS, HOME_TRUST_PILLS } from "./data";
import HomeSectionReveal from "./HomeSectionReveal";
import { childFadeUp, staggerContainer } from "./motion";

export default function HomeTrustBar() {
  return (
    <HomeSectionReveal className="mb-12" variant="fadeIn">
      <motion.div
        className="home-stats-row mb-8"
        variants={staggerContainer(0.06)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
      >
        {HOME_STATS.map((s) => (
          <motion.div key={s.label} className="home-stat-chip glass-panel glass-panel--subtle" variants={childFadeUp}>
            <div className="home-stat-value">{s.value}</div>
            <div className="home-stat-label">{s.label}</div>
            <div className="home-stat-detail">{s.detail}</div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        variants={staggerContainer(0.07, 0.1)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
      >
        {HOME_TRUST_PILLS.map((pill) => (
          <motion.div key={pill.title} className="home-trust-card glass-panel glass-panel--subtle" variants={childFadeUp}>
            <span className="text-2xl mb-2 block">{pill.icon}</span>
            <h3 className="font-semibold text-[15px] tracking-tight text-zinc-100">{pill.title}</h3>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{pill.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </HomeSectionReveal>
  );
}