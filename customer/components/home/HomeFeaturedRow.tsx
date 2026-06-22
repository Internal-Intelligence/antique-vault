import { useEffect, useState } from "react";
import Link from "next/link";
import { useConnection } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import { CONDITIONS } from "../../lib/anchor";
import { loadMarketplaceItems, type MarketplaceItem } from "../../lib/nftbay";
import { CURATED_PICKS } from "./data";

function formatUsd(cents: number, lamports?: number) {
  if (lamports && lamports > 0) return `$${(lamports / 1_000_000_000).toFixed(0)}`;
  return `$${(cents / 100).toFixed(0)}`;
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
    <section className="mb-12">
      <div className="flex items-end justify-between gap-4 mb-5 px-0.5">
        <div>
          <h2 className="home-section-title">Today&apos;s picks for you</h2>
          <p className="home-section-sub">
            {showCurated
              ? "Curated deals while listings go live — prices update when sellers list on-chain."
              : "Fresh from the marketplace and vault bridge."}
          </p>
        </div>
        <Link href="/market" className="home-link-arrow shrink-0">
          See all deals
        </Link>
      </div>

      {loading ? (
        <div className="home-featured-scroll">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="home-deal-card home-deal-card--skeleton" />
          ))}
        </div>
      ) : (
        <div className="home-featured-scroll">
          {display.map((deal, i) => (
            <motion.div
              key={deal.key}
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={deal.href} className="home-deal-card group">
                <div className="home-deal-visual">
                  <span className="home-deal-emoji" aria-hidden>
                    {deal.category.includes("Phone") ? "📱" : deal.category.includes("Laptop") ? "💻" : deal.category.includes("Game") ? "🎮" : "✨"}
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
        </div>
      )}
    </section>
  );
}