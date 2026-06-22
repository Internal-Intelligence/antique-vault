import Link from "next/link";
import { motion } from "framer-motion";
import { HOME_CATEGORIES } from "./data";
import HomeSectionReveal, { HomeSectionHeader } from "./HomeSectionReveal";
import { childFadeUp, staggerContainer } from "./motion";

export default function HomeCategoryGrid() {
  return (
    <HomeSectionReveal className="mb-12" variant="fadeUp" delay={0.05}>
      <HomeSectionHeader className="flex items-end justify-between gap-4 mb-5 px-0.5">
        <div>
          <h2 className="home-section-title">Browse categories</h2>
          <p className="home-section-sub">Phones, laptops, collectibles, and more — all vault-backed.</p>
        </div>
        <Link href="/market" className="home-link-arrow shrink-0">
          All categories
        </Link>
      </HomeSectionHeader>

      <motion.div
        className="home-category-grid"
        variants={staggerContainer(0.05)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
      >
        {HOME_CATEGORIES.map((cat) => (
          <motion.div key={cat.id} variants={childFadeUp}>
            <Link
              href={`/market?q=${encodeURIComponent(cat.query)}`}
              className={`home-category-card glass-panel glass-panel--tile bg-gradient-to-br ${cat.gradient}`}
            >
              <span className="home-category-icon">{cat.icon}</span>
              <span className="home-category-label">{cat.label}</span>
              <span className="home-category-tag">{cat.tagline}</span>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </HomeSectionReveal>
  );
}