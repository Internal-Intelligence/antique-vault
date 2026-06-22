import Link from "next/link";
import { motion } from "framer-motion";
import HomeSectionReveal from "./HomeSectionReveal";
import { childFadeUp, staggerContainer } from "./motion";

const CUSTODY_STEPS = [
  {
    icon: "📦",
    title: "Intake",
    desc: "Ship your item or browse listings already in vault custody.",
  },
  {
    icon: "🏦",
    title: "Custody",
    desc: "Every NFT maps to a physical item — stored, insured, and tracked.",
  },
  {
    icon: "✓",
    title: "Settlement",
    desc: "Escrow releases funds when the sale closes. Redeem the real thing anytime.",
  },
];

export default function HomeCustodyStrip() {
  return (
    <HomeSectionReveal className="mb-10" variant="fadeIn" delay={0.08}>
      <div className="home-custody-strip glass-panel glass-panel--subtle">
        <div className="home-custody-header">
          <div>
            <h2 className="home-custody-title">How custody works</h2>
            <p className="home-custody-sub">
              Real items, clear ownership — no mystery boxes, no rush to bid.
            </p>
          </div>
          <Link href="/fees" className="home-link-arrow shrink-0 hidden sm:inline-flex">
            Fees &amp; escrow
          </Link>
        </div>

        <motion.div
          className="home-custody-steps"
          variants={staggerContainer(0.08, 0.12)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        >
          {CUSTODY_STEPS.map((step, i) => (
            <motion.div key={step.title} className="home-custody-step" variants={childFadeUp}>
              {i > 0 && <span className="home-custody-connector" aria-hidden />}
              <span className="home-custody-icon" aria-hidden>
                {step.icon}
              </span>
              <h3 className="home-custody-step-title">{step.title}</h3>
              <p className="home-custody-step-desc">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </HomeSectionReveal>
  );
}