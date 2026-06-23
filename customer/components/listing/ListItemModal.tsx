import { useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { IosModal, IosRow } from "../IosModal";
import FeeDisclosure from "../FeeDisclosure";
import { requireIdVerification } from "../../lib/anchor";
import type { VaultItem } from "../../lib/fetchOwnedItems";
import { getNeurochipBoosterDecision } from "../../lib/quantum";
import {
  createNftBayListing,
  formatSolLamports,
  getNftBayProgram,
  getPlatformFeeRecipient,
  getSellerNftAta,
} from "../../lib/nftbay";

export type ListingMode = "fixed" | "auction";

const AUCTION_DURATIONS: { label: string; seconds: number }[] = [
  { label: "24 hours", seconds: 86400 },
  { label: "48 hours", seconds: 172800 },
  { label: "7 days", seconds: 604800 },
];

export interface ListItemModalProps {
  item: VaultItem;
  initialMode?: ListingMode;
  initialBoost?: boolean;
  onClose: () => void;
  onListed?: (mode: ListingMode) => void;
}

export default function ListItemModal({
  item,
  initialMode = "fixed",
  initialBoost = false,
  onClose,
  onListed,
}: ListItemModalProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [listingMode, setListingMode] = useState<ListingMode>(initialMode);
  const [durationSec, setDurationSec] = useState(AUCTION_DURATIONS[1].seconds);
  const [reserveSol, setReserveSol] = useState("");
  const [startBidSol, setStartBidSol] = useState("");
  const [selectedBoosterBps, setSelectedBoosterBps] = useState(420);
  const [selectedOwnerFeeBps, setSelectedOwnerFeeBps] = useState(500);
  const [listingStatus, setListingStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const estUsd = (item.appraisedValueUsdCents || 1200) / 100;
  const defaultSol = useMemo(() => Math.max(0.01, estUsd / 150), [estUsd]);

  const neuroDecision = useMemo(() => {
    const priceApprox = (item.appraisedValueUsdCents || 4500) * 100000;
    return getNeurochipBoosterDecision(priceApprox, item.category || "General", 0.55, 1);
  }, [item]);

  useEffect(() => {
    setListingMode(initialMode);
    if (initialBoost) {
      setSelectedOwnerFeeBps(800);
      setListingStatus("Boost mode — promoted 8% fee selected");
    }
  }, [initialMode, initialBoost]);

  useEffect(() => {
    if (neuroDecision) {
      setSelectedBoosterBps(Math.floor(neuroDecision.xPct * 10000));
      if (!initialBoost) setSelectedOwnerFeeBps(neuroDecision.ownerFeeBps);
    }
  }, [neuroDecision, initialBoost]);

  useEffect(() => {
    if (!reserveSol) setReserveSol(defaultSol.toFixed(3));
    if (!startBidSol) setStartBidSol((defaultSol * 0.85).toFixed(3));
  }, [defaultSol, reserveSol, startBidSol]);

  async function handleList() {
    if (!wallet.publicKey) return;
    await requireIdVerification(
      "list-" + item.itemId,
      listingMode === "auction" ? "auction-list" : "secondary-list",
      wallet.publicKey.toBase58()
    );
    setSubmitting(true);
    setListingStatus("Preparing listing…");
    try {
      const nProgram = getNftBayProgram(wallet as any, connection);
      const nftMint = new PublicKey(item.nftMint);
      const sellerAta = getSellerNftAta(nftMint, wallet.publicKey);
      const isAuction = listingMode === "auction";
      const reserveLamports = Math.floor(parseFloat(reserveSol || "0") * 1e9);
      const startLamports = Math.floor(parseFloat(startBidSol || reserveSol || "0") * 1e9);
      const priceLamports = isAuction
        ? Math.max(startLamports, reserveLamports)
        : (item.appraisedValueUsdCents || 1200) * 10000;
      const isPromoted = !!neuroDecision?.recommendedBoost || selectedOwnerFeeBps >= 800;

      if (isAuction && reserveLamports <= 0) {
        throw new Error("Set a reserve price in SOL for auctions.");
      }

      await createNftBayListing(
        nProgram,
        nftMint,
        sellerAta,
        new BN(priceLamports),
        isAuction ? 1 : 0,
        isAuction ? durationSec : 86400 * 7,
        new BN(isAuction ? reserveLamports : 0),
        isPromoted,
        item.category || "General",
        selectedOwnerFeeBps,
        getPlatformFeeRecipient() ?? PublicKey.default,
        selectedBoosterBps,
        0,
        neuroDecision?.neuroScore || 78
      );

      setListingStatus(
        isAuction
          ? `Auction live on devnet — ${formatSolLamports(reserveLamports)} SOL reserve.`
          : "Fixed-price listing live on devnet."
      );
      onListed?.(listingMode);
    } catch (e: any) {
      setListingStatus("Sign with wallet: " + (e?.message || "failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <IosModal onClose={onClose}>
      <div className="text-center">
        <div className="text-3xl mb-3">{listingMode === "auction" ? "🏛️" : "🏷️"}</div>
        <h2 className="text-xl font-bold mb-1">
          {listingMode === "auction" ? "Start auction" : "List on NFTBAY"}
        </h2>
        <p className="text-gray-500 text-sm mb-4">
          5% standard · 8% promoted. Winners have 72h to claim and ship.
        </p>

        <div className="flex gap-2 mb-4">
          {(["fixed", "auction"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setListingMode(mode)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                listingMode === mode
                  ? "border-emerald-400 bg-emerald-500/15 text-emerald-300"
                  : "border-white/10 text-zinc-400 hover:border-white/20"
              }`}
            >
              {mode === "fixed" ? "Fixed price" : "Auction"}
            </button>
          ))}
        </div>

        <div className="ios-inset text-sm text-left mb-4">
          <IosRow label="Item" value={item.name} />
          <IosRow label="Est value" value={`$${estUsd.toFixed(0)}`} />
          <IosRow label="Platform fee" value={`${(selectedOwnerFeeBps / 100).toFixed(1)}%`} />
          {listingMode === "auction" && (
            <>
              <IosRow label="Duration" value={AUCTION_DURATIONS.find((d) => d.seconds === durationSec)?.label ?? "Custom"} />
              <IosRow label="Reserve" value={`${reserveSol || "—"} SOL`} />
            </>
          )}
        </div>

        {listingMode === "auction" && (
          <div className="text-left space-y-3 mb-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">
                Auction duration
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AUCTION_DURATIONS.map((d) => (
                  <button
                    key={d.seconds}
                    type="button"
                    onClick={() => setDurationSec(d.seconds)}
                    className={`text-xs px-3 py-1.5 rounded-full border ${
                      durationSec === d.seconds
                        ? "border-emerald-400 bg-emerald-500/10 text-emerald-300"
                        : "border-white/10 text-zinc-400"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                  Opening bid (SOL)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={startBidSol}
                  onChange={(e) => setStartBidSol(e.target.value)}
                  className="w-full ios-input text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                  Reserve floor (SOL)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={reserveSol}
                  onChange={(e) => setReserveSol(e.target.value)}
                  className="w-full ios-input text-sm"
                />
              </div>
            </div>
            <p className="text-[10px] text-zinc-500">
              Bids escrow in SOL on-chain. If the winner doesn&apos;t claim within 72h, the listing relists with bid SOL as the new floor.
            </p>
          </div>
        )}

        {neuroDecision && (
          <div className="mb-5 ios-inset text-left">
            <div className="uppercase tracking-[1.5px] text-[10px] text-[#22ffaa] mb-1">AI promotion suggestion</div>
            <div className="text-lg font-bold text-white mb-1">
              {(neuroDecision.xPct * 100).toFixed(1)}% promoter share · {(selectedOwnerFeeBps / 100).toFixed(1)}% platform
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[250, 420, 650].map((bp) => (
                <button
                  key={bp}
                  type="button"
                  onClick={() => setSelectedBoosterBps(bp)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    selectedBoosterBps === bp ? "border-emerald-400 bg-emerald-500/10" : "border-white/10"
                  }`}
                >
                  {(bp / 100).toFixed(1)}%
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          disabled={!wallet.connected || !neuroDecision || submitting}
          onClick={handleList}
          className="w-full ios-btn ios-btn-primary disabled:opacity-50 mb-2"
        >
          {submitting
            ? "Confirm in wallet…"
            : listingMode === "auction"
              ? "Start auction"
              : "Activate listing"}
        </button>
        <div className="text-[10px] text-center text-emerald-400 mb-3 min-h-[1rem]">{listingStatus}</div>
        <FeeDisclosure compact promoted={selectedOwnerFeeBps >= 800} />
      </div>
    </IosModal>
  );
}