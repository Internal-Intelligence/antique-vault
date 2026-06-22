import Link from "next/link";
import { motion } from "framer-motion";
import { HOME_CATEGORIES } from "./data";

export default function HomeCategoryGrid() {
  return (
    <section className="mb-12">
      <div className="flex items-end justify-between gap-4 mb-5 px-0.5">
        <div>
          <h2 className="home-section-title">Shop by category</h2>
          <p className="home-section-sub">Jump straight into what you care about — no endless scrolling.</p>
        </div>
        <Link href="/market" className="home-link-arrow shrink-0">
          All categories
        </Link>
      </div>

      <div className="home-category-grid">
        {HOME_CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: i * 0.04, duration: 0.35 }}
          >
            <Link
              href={`/market?q=${encodeURIComponent(cat.query)}`}
              className={`home-category-card bg-gradient-to-br ${cat.gradient}`}
            >
              <span className="home-category-icon">{cat.icon}</span>
              <span className="home-category-label">{cat.label}</span>
              <span className="home-category-tag">{cat.tagline}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}