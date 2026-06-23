import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import Layout from "../components/Layout";
import {
  AuctionCard,
  AuctionClaimModal,
  AuctionIncentiveStrip,
  AuctionMissionBand,
  AuctionStatsRow,
} from "../components/auctions";
import { useAuctionBid } from "../hooks/useAuctionBid";
import { requireIdVerification } from "../lib/anchor";
import { isIncentiveBidder, showIncentiveBadge } from "../lib/incentiveBot";
import { fetchListings } from "../lib/apiClient";
import type { MarketplaceItem } from "../lib/nftbay";

type Tab = "live" | "ending" | "bids" | "won";

export default function AuctionsPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { placeBid, isBidding } = useAuctionBid();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("live");
  const [claimItem, setClaimItem] = useState<MarketplaceItem | null>(null);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { items: rows } = await fetchListings(false, connection);
      setItems(rows.filter((i) => i.listingType === 1 || i.claimStatus === 1));
    } finally {
      setLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    load();
    const poll = setInterval(load, 8000);
    return () => clearInterval(poll);
  }, [load]);

  const now = Math.floor(Date.now() / 1000);
  const walletPk = wallet.publicKey?.toString();

  const auctions = useMemo(() => items.filter((i) => i.listingType === 1), [items]);

  const stats = useMemo(() => {
    const live = auctions.filter((i) => i.isActive && i.endTime > now);
    return {
      live: live.length,
      endingSoon: live.filter((i) => i.endTime - now < 86400).length,
      incentiveEligible: live.filter((i) => showIncentiveBadge(i)).length,
      botLeading: live.filter((i) => isIncentiveBidder(i.highestBidder)).length,
    };
  }, [auctions, now]);

  const filtered = useMemo(() => {
    switch (tab) {
      case "ending":
        return auctions
          .filter((i) => i.isActive && i.endTime > now && i.endTime - now < 86400)
          .sort((a, b) => a.endTime - b.endTime);
      case "bids":
        if (!walletPk) return [];
        return auctions.filter(
          (i) =>
            i.highestBidder === walletPk ||
            (i.buyer === walletPk && i.claimStatus === 1)
        );
      case "won":
        if (!walletPk) return [];
        return items.filter((i) => i.buyer === walletPk && i.claimStatus === 1);
      default:
        return auctions
          .filter((i) => i.isActive && i.endTime > now)
          .sort((a, b) => a.endTime - b.endTime);
    }
  }, [auctions, items, tab, walletPk, now]);

  async function handleBid(item: MarketplaceItem, bidLamports: number) {
    await requireIdVerification("auctions-bid-" + item.itemId, "place-bid", wallet.publicKey?.toBase58());
    if (!item.listingPda) return;
    try {
      await placeBid({
        listingPda: item.listingPda,
        nftMint: item.nftMint,
        bidLamports,
        highestBidLamports: item.highestBidLamports,
        reserveLamports: item.reservePriceLamports ?? 0,
        highestBidder: item.highestBidder,
      });
      setToast(`Bid placed on ${item.name}`);
      await load();
    } catch (e: any) {
      setToast(e?.message || "Bid failed");
    }
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "live", label: "Live", count: stats.live },
    { id: "ending", label: "Ending soon", count: stats.endingSoon },
    { id: "bids", label: "My bids" },
    { id: "won", label: "Won / claim" },
  ];

  return (
    <Layout wide>
      <div className="auctions-page">
        <header className="auctions-header">
          <p className="mission-kicker">Vault-backed auctions</p>
          <div className="auctions-header__row">
            <div>
              <h1 className="page-title">Timed sales on verified inventory</h1>
              <p className="page-subtitle max-w-2xl">
                Bid in SOL on warehouse-custodied items. Fee-funded incentive liquidity may appear on standout
                tech, jewelry, and card listings — always labeled. Escrow holds until settlement; winners have
                72 hours to claim.
              </p>
            </div>
            {!wallet.connected && (
              <p className="auctions-header__wallet-hint">Connect wallet to bid or claim.</p>
            )}
          </div>
        </header>

        <AuctionMissionBand />
        <AuctionStatsRow stats={stats} />
        <AuctionIncentiveStrip />

        <nav className="auctions-tabs" aria-label="Auction views">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`auctions-tab ${tab === t.id ? "auctions-tab--active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.count != null && t.count > 0 && (
                <span className="auctions-tab__count">{t.count}</span>
              )}
            </button>
          ))}
        </nav>

        {toast && (
          <p className="auctions-toast" role="status">
            {toast}
          </p>
        )}

        {loading ? (
          <p className="auctions-loading">Loading auctions…</p>
        ) : filtered.length === 0 ? (
          <div className="auctions-empty glass-panel glass-panel--subtle">
            <p className="auctions-empty__title">No auctions in this view yet</p>
            <p className="auctions-empty__sub">
              {tab === "bids" || tab === "won"
                ? "Your bids and wins will show here once you participate."
                : "List from your vault after warehouse intake — or check back when devnet listings are live."}
            </p>
            <div className="auctions-empty__actions">
              <Link href="/sell" className="btn-primary text-sm min-h-[40px]">
                Start selling
              </Link>
              <Link href="/mission" className="btn-secondary text-sm min-h-[40px]">
                How fees work
              </Link>
              <Link href="/warehouse" className="home-ghost-btn min-h-[40px]">
                Verification hub →
              </Link>
            </div>
          </div>
        ) : (
          <div className="auctions-grid">
            {filtered.map((item) => (
              <AuctionCard
                key={item.nftMint + (item.listingPda ?? "")}
                item={item}
                onBid={handleBid}
                onClaim={setClaimItem}
                bidding={isBidding(item.nftMint)}
                walletPk={walletPk}
              />
            ))}
          </div>
        )}

        <footer className="auctions-footer">
          <p>
            Every auction NFT maps to a physical unit in NFTBAY custody.{" "}
            <Link href="/fees" className="text-emerald-500/90 hover:underline">
              Fee allocation
            </Link>{" "}
            funds inventory and incentive bids — see{" "}
            <Link href="/mission" className="text-emerald-500/90 hover:underline">
              mission
            </Link>
            .
          </p>
        </footer>
      </div>

      {claimItem && (
        <AuctionClaimModal
          item={claimItem}
          onClose={() => setClaimItem(null)}
          onComplete={() => {
            setClaimItem(null);
            load();
          }}
        />
      )}
    </Layout>
  );
}