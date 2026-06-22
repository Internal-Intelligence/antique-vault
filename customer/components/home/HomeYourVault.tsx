import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getProgram } from "../../lib/anchor";
import { fetchOwnedVaultItems, type VaultItem } from "../../lib/fetchOwnedItems";
import HomeSectionReveal from "./HomeSectionReveal";
import { softTransition } from "./motion";

function VaultSkeleton() {
  return (
    <div className="home-vault-skeleton" aria-hidden>
      <div className="home-vault-skeleton-line home-vault-skeleton-line--short" />
      <div className="home-vault-skeleton-line home-vault-skeleton-line--long" />
      <div className="home-vault-skeleton-line home-vault-skeleton-line--mid" />
    </div>
  );
}

export default function HomeYourVault() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!wallet.connected || !wallet.publicKey) return;
    let cancelled = false;
    setLoading(true);
    const program = getProgram(wallet, connection);
    fetchOwnedVaultItems(program, connection, wallet.publicKey)
      .then((owned) => {
        if (!cancelled) setItems(owned);
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
  }, [wallet.connected, wallet.publicKey, connection]);

  if (!wallet.connected) {
    return (
      <HomeSectionReveal
        className="home-vault-strip home-vault-strip--guest glass-panel glass-panel--subtle mb-10"
        variant="fadeIn"
        delay={0.1}
      >
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Your vault awaits</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Connect a wallet to track inventory, flex achievements, and watch earnings grow.
          </p>
        </div>
        <p className="text-xs text-zinc-600">Use the wallet button in the header ↑</p>
      </HomeSectionReveal>
    );
  }

  const totalUsd = items.reduce((s, i) => s + i.appraisedValueUsdCents, 0) / 100;
  const inVault = items.filter((i) => i.status === 0).length;

  return (
    <HomeSectionReveal
      className="home-vault-strip glass-panel glass-panel--subtle mb-10"
      variant="fadeUp"
      delay={0.12}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-1">
          <div className="min-h-[4.5rem]">
            <p className="text-xs font-medium text-emerald-400/90 mb-1">Welcome back</p>
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={softTransition(0.3)}
                >
                  <VaultSkeleton />
                  <p className="text-xs text-zinc-600 mt-2 load-soft-pulse">Syncing your vault…</p>
                </motion.div>
              ) : (
                <motion.div
                  key="loaded"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={softTransition(0.45)}
                >
                  <h2 className="text-lg font-semibold tracking-tight">
                    {items.length} item{items.length === 1 ? "" : "s"} · ${totalUsd.toLocaleString()} est.
                  </h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    {inVault} in custody · achievements &amp; income tools in your profile
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <motion.div
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: loading ? 0.6 : 1, x: 0 }}
            transition={softTransition(0.45, 0.1)}
          >
            <Link href="/profile" className="btn-primary text-sm min-h-[40px] px-4">
              Open profile
            </Link>
            <Link href="/?action=list" className="btn-secondary text-sm min-h-[40px] px-4">
              List an item
            </Link>
          </motion.div>
      </div>
    </HomeSectionReveal>
  );
}