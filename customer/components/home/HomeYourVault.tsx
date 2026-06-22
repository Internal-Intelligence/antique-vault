import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { getProgram } from "../../lib/anchor";
import { fetchOwnedVaultItems, type VaultItem } from "../../lib/fetchOwnedItems";

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
      <section className="home-vault-strip home-vault-strip--guest glass-panel glass-panel--subtle mb-10">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Your vault awaits</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Connect a wallet to track inventory, flex achievements, and watch earnings grow.
          </p>
        </div>
        <p className="text-xs text-zinc-600">Use the wallet button in the header ↑</p>
      </section>
    );
  }

  const totalUsd = items.reduce((s, i) => s + i.appraisedValueUsdCents, 0) / 100;
  const inVault = items.filter((i) => i.status === 0).length;

  return (
    <section className="home-vault-strip glass-panel glass-panel--subtle mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-emerald-400/90 mb-1">Welcome back</p>
          <h2 className="text-lg font-semibold tracking-tight">
            {loading ? "Loading your vault…" : `${items.length} item${items.length === 1 ? "" : "s"} · $${totalUsd.toLocaleString()} est.`}
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            {inVault} in custody · achievements &amp; income tools in your profile
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/profile" className="btn-primary text-sm min-h-[40px] px-4">
            Open profile
          </Link>
          <Link href="/?action=list" className="btn-secondary text-sm min-h-[40px] px-4">
            List an item
          </Link>
        </div>
      </div>
    </section>
  );
}