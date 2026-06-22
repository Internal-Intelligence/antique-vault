import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import Link from "next/link";
import { claimAuctionWin, formatSolLamports, getNftBayProgram } from "../../lib/nftbay";
import { getProgram } from "../../lib/anchor";
import { burnVaultNft } from "../../lib/burn";
import type { MarketplaceItem } from "../../lib/nftbay";

export interface ShippingForm {
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

const EMPTY_FORM: ShippingForm = {
  fullName: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
  phone: "",
};

function buildAddressString(form: ShippingForm): string {
  return [
    form.fullName,
    form.line1,
    form.line2,
    `${form.city}, ${form.state} ${form.zip}`,
    form.country,
    form.phone ? `Phone: ${form.phone}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export default function AuctionClaimModal({
  item,
  onClose,
  onComplete,
}: {
  item: MarketplaceItem;
  onClose: () => void;
  onComplete: () => void;
}) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [form, setForm] = useState<ShippingForm>(EMPTY_FORM);
  const [step, setStep] = useState<"form" | "processing" | "done">("form");
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const deadline = item.claimDeadline ?? 0;
  const remaining = Math.max(0, deadline - Math.floor(Date.now() / 1000));

  function field(key: keyof ShippingForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!wallet.connected || !wallet.publicKey || !item.listingPda) return;
    if (!confirmed) {
      setError("Confirm you understand this claim is irreversible.");
      return;
    }
    setError("");
    setStep("processing");
    try {
      const program = getNftBayProgram(wallet as any, connection);
      const shippingAddress = buildAddressString(form);

      await claimAuctionWin(
        program,
        new PublicKey(item.listingPda),
        new PublicKey(item.nftMint),
        wallet.publicKey,
        new PublicKey(item.seller)
      );

      const vaultProgram = getProgram(wallet, connection);
      const allRecords = await vaultProgram.account.itemRecord.all();
      const match = allRecords.find(
        ({ account }: any) => account.nftMint.toString() === item.nftMint
      );
      if (match) {
        const nftTokenAccount = (
          await import("@solana/spl-token")
        ).getAssociatedTokenAddressSync(new PublicKey(item.nftMint), wallet.publicKey);
        await vaultProgram.methods
          .redeemItem(item.itemId, shippingAddress)
          .accounts({
            item: match.publicKey,
            nftTokenAccount,
            owner: wallet.publicKey,
          })
          .rpc();
      }

      await burnVaultNft(wallet, connection.rpcEndpoint, item.nftMint);
      setStep("done");
      onComplete();
    } catch (err: any) {
      setError(err?.message || "Claim failed");
      setStep("form");
    }
  }

  if (step === "done") {
    return (
      <div className="auction-modal">
        <div className="auction-modal-inner glass-panel text-center">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-xl font-semibold mb-2">Claim complete</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Your item ships to the address below. Tracking within 1–2 business days.
          </p>
          <pre className="text-left text-xs bg-white/5 rounded-lg p-3 mb-6 whitespace-pre-wrap">
            {buildAddressString(form)}
          </pre>
          <button type="button" className="btn-primary w-full" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auction-modal" onClick={onClose}>
      <div className="auction-modal-inner glass-panel" onClick={(e) => e.stopPropagation()}>
        <p className="mission-kicker mb-2">Warehouse ship-out</p>
        <h2 className="text-xl font-semibold mb-1">Claim your win</h2>
        <p className="text-sm text-zinc-400 mb-4">
          {item.name} — {formatSolLamports(item.escrowedPotLamports ?? item.highestBidLamports)} SOL escrowed
        </p>
        {remaining > 0 ? (
          <p className="text-sm text-amber-400 mb-4">
            Claim within {Math.floor(remaining / 3600)}h {Math.floor((remaining % 3600) / 60)}m or the listing relists.
          </p>
        ) : (
          <p className="text-sm text-red-400 mb-4">Claim window may have expired.</p>
        )}

        <form onSubmit={handleClaim} className="space-y-3">
          {(["fullName", "line1", "line2", "city", "state", "zip", "phone"] as const).map((key) => (
            <input
              key={key}
              className="auction-input"
              placeholder={key === "line1" ? "Street address" : key}
              value={form[key]}
              onChange={(e) => field(key, e.target.value)}
              required={key !== "line2"}
            />
          ))}
          <label className="flex items-start gap-2 text-xs text-zinc-400">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            I understand claiming burns my NFT and triggers physical shipment.
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={step === "processing"}>
              {step === "processing" ? "Claiming…" : "Claim & ship"}
            </button>
          </div>
        </form>
        <Link href={`/redeem/${item.nftMint}`} className="text-xs text-zinc-500 mt-3 inline-block hover:text-zinc-300">
          Open full redeem page →
        </Link>
      </div>
    </div>
  );
}