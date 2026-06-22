import Link from "next/link";
import { motion } from "framer-motion";
import { HOME_HOW_IT_WORKS } from "./data";
import HomeSectionReveal, { HomeSectionHeader } from "./HomeSectionReveal";
import { childFadeUp, softTransition, staggerContainer } from "./motion";

export default function HomeHowItWorks() {
  return (
    <HomeSectionReveal className="mb-12" variant="fadeUp">
      <HomeSectionHeader className="text-center mb-8">
        <h2 className="home-section-title">How NFTBAY works</h2>
        <p className="home-section-sub mx-auto max-w-lg">
          Four steps from listing to settlement — sell for SOL or redeem the physical item.
        </p>
      </HomeSectionHeader>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={staggerContainer(0.08)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
      >
        {HOME_HOW_IT_WORKS.map((step) => (
          <motion.div key={step.step} className="home-step-card glass-panel glass-panel--subtle" variants={childFadeUp}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{step.icon}</span>
              <span className="text-[11px] font-mono text-emerald-500/80">{step.step}</span>
            </div>
            <h3 className="font-semibold text-[16px] mb-2">{step.title}</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">{step.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.p
        className="text-center text-xs text-zinc-600 mt-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={softTransition(0.5, 0.3)}
      >
        Physical goods only. Optional mail-in recycling lives in your{" "}
        <Link href="/profile?tab=expand" className="text-emerald-500/90 hover:underline">
          Profile → Grow
        </Link>
        .
      </motion.p>
    </HomeSectionReveal>
  );
}