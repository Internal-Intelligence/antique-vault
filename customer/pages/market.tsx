import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import { CONDITIONS, requireIdVerification } from "../lib/anchor";
import { fetchNftImage } from "../lib/burn";
import NftCard, { type NftCardItem } from "../components/NftCard";
import { fetchListings } from "../lib/apiClient";
import {
  executeBuyListing,
  placeAuctionBid,
  getNftBayProgram,
  type MarketplaceItem,
} from "../lib/nftbay";
import { BN } from "@coral-xyz/anchor";

export default function Marketplace() {
  const router = useRouter();
  const { connection } = useConnection();
  const wallet = useWallet();
  const [listings, setListings] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query.q;
    if (typeof q === "string" && q.trim()) setSearch(q.trim());
  }, [router.isReady, router.query.q]);
  const [filter, setFilter] = useState<number | null>(null);
  const [bids, setBids] = useState<Record<string, number>>({});
  const [auctionBidding, setAuctionBidding] = useState<string | null>(null);
  const [buyingMint, setBuyingMint] = useState<string | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [listSource, setListSource] = useState<"nftbay" | "vault-fallback" | "api-cache">("nftbay");

  const loadListings = useCallback(async () => {
    setLoading(true);
    setBuyError(null);
    try {
      const { items, source } = await fetchListings(false, connection);
      const hasOnChain = items.some((i) => !i.isVaultOnly);
      setListSource(
        source === "api" ? "api-cache" : hasOnChain ? "nftbay" : "vault-fallback"
      );
      setListings(items);
      setLoading(false);

      items.forEach((item) => {
        fetchNftImage(item.nftMint, connection.rpcEndpoint).then((img) => {
          if (img) {
            setListings((prev) =>
              prev.map((l) => (l.nftMint === item.nftMint ? { ...l, image: img } : l))
            );
          }
        });
      });
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const handleBuy = useCallback(
    async (item: MarketplaceItem) => {
      setBuyError(null);
      await requireIdVerification("market-buy-" + item.itemId, "buy-listing", wallet.publicKey?.toBase58());

      if (!wallet.connected) {
        setBuyError("Connect your wallet to buy on NFTBAY.");
        return;
      }

      setBuyingMint(item.nftMint);
      try {
        const sig = await executeBuyListing(wallet, connection, item);
        alert(`Purchase submitted on NFTBAY.\nTx: ${sig.slice(0, 16)}…\nStandard marketplace fees applied at settlement.`);
        await loadListings();
      } catch (e: any) {
        const msg = e?.message || "Purchase failed — sign with wallet on devnet.";
        setBuyError(msg);
        console.error("[NFTBAY BUY]", e);
      } finally {
        setBuyingMint(null);
      }
    },
    [wallet, connection, loadListings]
  );

  const filtered = useMemo(
    () =>
      listings.filter((l) => {
        const matchSearch =
          !search ||
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          l.itemId.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === null || l.condition === filter;
        return matchSearch && matchFilter;
      }),
    [listings, search, filter]
  );

  const listedCount = filtered.filter((l) => !l.isVaultOnly).length;

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="page-title">Marketplace</h1>
        <p className="page-subtitle">Browse tokenized goods on NFTBAY. Fixed price listings and live auctions.</p>
        {listSource === "vault-fallback" && (
          <p className="text-xs text-amber-400/90 mt-2">
            Showing vault inventory — no active NFTBAY listings on-chain yet. Sellers can list from My NFTs.
          </p>
        )}
        {buyError && (
          <p className="text-xs text-red-400 mt-2" role="alert">
            {buyError}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-7">
        <input
          type="text"
          placeholder="Search listings…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 ios-input text-sm"
        />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilter(null)} className={`filter-btn ${filter === null ? "active" : ""}`}>
            All
          </button>
          {CONDITIONS.map((c, i) => (
            <button
              key={c}
              onClick={() => setFilter(filter === i ? null : i)}
              className={`filter-btn ${filter === i ? "active" : ""}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#22ffaa]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-gray-600">No matches.</div>
      ) : (
        <>
          <p className="text-sm text-zinc-500 mb-4">
            {filtered.length} {filtered.length === 1 ? "item" : "items"}
            {listedCount > 0 && ` • ${listedCount} on-chain listing${listedCount === 1 ? "" : "s"}`}
          </p>

          <div className="quantum-grid">
            {filtered.map((item) => {
              const boosted = item.isPromoted || parseInt(item.itemId.slice(-1), 36) % 3 === 0;
              const boostPercent = boosted ? 5 + (item.condition % 4) * 3 : undefined;
              const priceUsd =
                item.priceLamports > 0
                  ? item.priceLamports / 1_000_000_000
                  : item.appraisedValueUsdCents / 100;
              const n: NftCardItem = {
                nftMint: item.nftMint,
                name: item.name,
                itemId: item.itemId,
                condition: item.condition,
                category: item.category || "Marketplace",
                image: item.image,
                appraisedValueUsdCents: item.appraisedValueUsdCents,
                boosted,
                boostPercent,
                boosterClaimable: boosted,
                listingPda: item.listingPda || undefined,
                priceLamports: item.priceLamports || undefined,
                priceUsd,
                isVaultOnly: item.isVaultOnly,
                listingType: item.listingType,
              };
              return (
                <NftCard
                  key={item.nftMint}
                  item={n}
                  mode="market"
                  showActions
                  onBuy={item.isVaultOnly ? undefined : () => handleBuy(item)}
                  buying={buyingMint === item.nftMint}
                />
              );
            })}
          </div>

          <div id="auctions" className="mt-14 pt-10 border-t border-white/[0.06]">
            <div className="flex items-end justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl font-semibold tracking-tight mb-1">Live auctions</h2>
                <p className="text-sm text-zinc-500">
                  Bid in SOL — winners claim shipping within 72 hours.
                </p>
              </div>
              <Link href="/auctions" className="text-sm text-emerald-400 hover:text-emerald-300 shrink-0">
                Full auctions tab →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered
                .filter((item) => item.listingType === 1 && !item.isVaultOnly)
                .slice(0, 4)
                .concat(filtered.filter((item) => item.isVaultOnly).slice(0, Math.max(0, 4 - filtered.filter((i) => i.listingType === 1 && !i.isVaultOnly).length)))
                .slice(0, 4)
                .map((item, idx) => {
                  const isBoosted = item.isPromoted || idx % 2 === 0;
                  const currentBid =
                    bids[item.nftMint] ||
                    (item.highestBidLamports > 0
                      ? item.highestBidLamports
                      : Math.floor(item.appraisedValueUsdCents * 0.6));
                  const nextBid = Math.floor(currentBid * 1.12) + 50;
                  const isOnChainAuction = item.listingType === 1 && !item.isVaultOnly;
                  return (
                    <motion.div
                      key={"auc" + item.nftMint}
                      whileHover={{ scale: 1.01, y: -1 }}
                      className="casino-card border border-white/10 p-5"
                    >
                      <div className="flex justify-between mb-2">
                        <div>
                          <div className="font-semibold">
                            {item.name}{" "}
                            <span className="text-[10px] text-gray-500">#{item.itemId.slice(0, 4)}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Est ${(item.appraisedValueUsdCents / 100).toFixed(0)}
                            {item.isVaultOnly && " • vault only"}
                          </div>
                        </div>
                        {isBoosted && (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Boosted
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-lg mb-1">
                        Current: <span className="text-[#22ffaa]">${(currentBid / 100).toFixed(0)}</span>
                      </div>
                      <div className="text-xs mb-3 text-gray-400">
                        Next min bid: ${(nextBid / 100).toFixed(0)} •{" "}
                        <span className="text-amber-400">
                          {isOnChainAuction ? "On-chain auction" : `Ends ~${18 - (idx % 9)}m (sim)`}
                        </span>
                      </div>
                      <button
                        onClick={async () => {
                          await requireIdVerification(
                            "market-auction-" + item.itemId,
                            "place-bid",
                            wallet.publicKey?.toBase58()
                          );
                          if (!wallet.connected) {
                            alert("Connect wallet to place on-chain bids.");
                            return;
                          }
                          setAuctionBidding(item.nftMint);
                          try {
                            if (isOnChainAuction && item.listingPda) {
                              const program = getNftBayProgram(wallet as any, connection);
                              await placeAuctionBid(
                                program,
                                new PublicKey(item.listingPda),
                                wallet.publicKey!,
                                new BN(Math.floor(nextBid * 10_000))
                              );
                              alert(`Bid placed on-chain: $${(nextBid / 100).toFixed(0)} on ${item.name}.`);
                            } else {
                              setBids((prev) => ({ ...prev, [item.nftMint]: nextBid }));
                              alert(
                                `Bid recorded (sim): $${(nextBid / 100).toFixed(0)} on ${item.name}. List on NFTBAY for on-chain auctions.`
                              );
                            }
                          } catch (e: any) {
                            alert("Bid failed: " + (e?.message || "sign with wallet on devnet"));
                          } finally {
                            setAuctionBidding(null);
                          }
                        }}
                        disabled={auctionBidding === item.nftMint}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-semibold rounded-lg disabled:opacity-50 text-sm transition-colors"
                      >
                        {auctionBidding === item.nftMint ? "Placing bid…" : "Place bid"}
                      </button>
                    </motion.div>
                  );
                })}
            </div>
            <div className="text-center mt-3 text-[10px] text-zinc-500">
              On-chain bids use placeBid ix. Standard marketplace fees apply at settlement.
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}