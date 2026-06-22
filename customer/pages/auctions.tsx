import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import Layout from "../components/Layout";
import AuctionCard from "../components/auctions/AuctionCard";
import AuctionClaimModal from "../components/auctions/AuctionClaimModal";
import { useAuctionBid } from "../hooks/useAuctionBid";
import { requireIdVerification } from "../lib/anchor";
import { loadMarketplaceItems, type MarketplaceItem } from "../lib/nftbay";

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
      const rows = await loadMarketplaceItems(connection);
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

  const filtered = useMemo(() => {
    const auctions = items.filter((i) => i.listingType === 1);
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
  }, [items, tab, walletPk, now]);

  async function handleBid(item: MarketplaceItem, bidLamports: number) {
    requireIdVerification("auctions-bid-" + item.itemId, "place-bid");
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

  const tabs: { id: Tab; label: string }[] = [
    { id: "live", label: "Live" },
    { id: "ending", label: "Ending soon" },
    { id: "bids", label: "My bids" },
    { id: "won", label: "Won / claim" },
  ];

  return (
    <Layout wide>
      <div className="auctions-page">
        <header className="auctions-header">
          <div>
            <h1 className="page-title">Auctions</h1>
            <p className="page-subtitle">
              Bid in SOL on vault-backed items. Winners have 72 hours to claim and enter shipping.
            </p>
          </div>
          {!wallet.connected && (
            <p className="text-sm text-amber-400/90">Connect wallet to bid or claim.</p>
          )}
        </header>

        <nav className="auctions-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`auctions-tab ${tab === t.id ? "auctions-tab--active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {toast && (
          <p className="text-sm text-zinc-400 mb-4" role="status">
            {toast}
          </p>
        )}

        {loading ? (
          <p className="text-zinc-500 text-sm">Loading auctions…</p>
        ) : filtered.length === 0 ? (
          <div className="auctions-empty">
            <p className="text-zinc-400 mb-2">No auctions in this view yet.</p>
            <p className="text-sm text-zinc-600">
              List an item as an auction from Sell, or check back when devnet listings are live.
            </p>
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