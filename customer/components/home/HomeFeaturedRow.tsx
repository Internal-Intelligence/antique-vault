import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useConnection } from "@solana/wallet-adapter-react";
import { CONDITIONS } from "../../lib/anchor";
import { loadMarketplaceItems, type MarketplaceItem } from "../../lib/nftbay";
import { CURATED_PICKS } from "./data";
import HomeSectionReveal, { HomeSectionHeader } from "./HomeSectionReveal";
import { childFadeUp, softTransition, staggerContainer } from "./motion";

function formatUsd(cents: number, lamports?: number) {
  if (lamports && lamports > 0) return `$${(lamports / 1_000_000_000).toFixed(0)}`;
  return `$${(cents / 100).toFixed(0)}`;
}

function FeaturedSkeleton() {
  return (
    <motion.div
      className="home-featured-scroll"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={softTransition(0.35)}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={i}
          className="home-deal-card home-deal-card--skeleton"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={softTransition(0.4, i * 0.08)}
        />
      ))}
    </motion.div>
  );
}

export default function HomeFeaturedRow() {
  const { connection } = useConnection();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadMarketplaceItems(connection)
      .then((rows) => {
        if (!cancelled) setItems(rows.slice(0, 8));
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [connection]);

  const showCurated = items.length < 4;
  const display = showCurated
    ? CURATED_PICKS.map((p) => ({
        key: p.id,
        name: p.name,
        category: p.category,
        price: `$${p.priceUsd}`,
        condition: CONDITIONS[p.condition] ?? "Good",
        badge: p.badge,
        href: "/market",
      }))
    : items.slice(0, 8).map((item) => ({
        key: item.nftMint,
        name: item.name,
        category: item.category || "Marketplace",
        price: formatUsd(item.appraisedValueUsdCents, item.priceLamports),
        condition: CONDITIONS[item.condition] ?? "Good",
        badge: item.isPromoted ? "Promoted" : item.isVaultOnly ? "Vault" : undefined,
        href: "/market",
      }));

  return (
    <HomeSectionReveal className="mb-12" variant="fadeUp">
      <HomeSectionHeader className="flex items-end justify-between gap-4 mb-5 px-0.5">
        <div>
          <h2 className="home-section-title">From the vault</h2>
          <p className="home-section-sub">
            {showCurated
              ? "Sample listings while the market fills in — each backed by a real item in custody."
              : "Current marketplace listings with verified condition and vault status."}
          </p>
        </div>
        <Link href="/market" className="home-link-arrow shrink-0">
          Browse market
        </Link>
      </HomeSectionHeader>

      <AnimatePresence mode="wait">
        {loading ? (
          <FeaturedSkeleton key="skeleton" />
        ) : (
          <motion.div
            key="content"
            className="home-featured-scroll"
            variants={staggerContainer(0.06)}
            initial="hidden"
            animate="visible"
          >
            {display.map((deal) => (
              <motion.div key={deal.key} variants={childFadeUp}>
                <Link href={deal.href} className="home-deal-card glass-panel glass-panel--card group">
                  <div className="home-deal-visual">
                    <span className="home-deal-emoji" aria-hidden>
                      {deal.category.includes("Phone")
                        ? "📱"
                        : deal.category.includes("Laptop")
                          ? "💻"
                          : deal.category.includes("Game")
                            ? "🎮"
                            : "✨"}
                    </span>
                    {deal.badge && <span className="home-deal-badge">{deal.badge}</span>}
                  </div>
                  <div className="home-deal-body">
                    <p className="home-deal-cat">{deal.category}</p>
                    <h3 className="home-deal-name">{deal.name}</h3>
                    <div className="home-deal-meta">
                      <span className="home-deal-price">{deal.price}</span>
                      <span className="home-deal-cond">{deal.condition}</span>
                    </div>
                    <span className="home-deal-cta">View listing →</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </HomeSectionReveal>
  );
}