import Link from "next/link";
import type { PawnForm, Valuation } from "../../lib/sell";
import { derivePreviewMint, derivePreviewItemId } from "../../lib/sell/nftPreview";

interface SellStepCompleteProps {
  tracking: string;
  valuation: Valuation | null;
  form: PawnForm;
  onReset: () => void;
}

export default function SellStepComplete({ tracking, valuation, form, onReset }: SellStepCompleteProps) {
  const nftMint = derivePreviewMint(form);
  const itemId = derivePreviewItemId(form);

  return (
    <div className="sell-glass-panel p-8 text-center">
      <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-emerald-500/15 flex items-center justify-center text-2xl">
        ✓
      </div>
      <h2 className="text-2xl font-semibold mb-2">Shipment submitted</h2>
      <p className="text-zinc-500 mb-8 max-w-sm mx-auto">
        Your item is on its way to our warehouse. Once received, your token will be minted and appear in your
        portfolio — preview it on the right.
      </p>

      <div className="ios-inset text-left mb-8 text-sm space-y-3">
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Tracking</span>
          <span className="text-emerald-400 font-medium">{tracking}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Offer</span>
          <span className="font-medium">${valuation?.offerUsd}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Device</span>
          <span className="text-right">{form.deviceName || form.category}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Condition</span>
          <span>{form.isWorking ? "Working" : "Non-working"}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Vault item ID</span>
          <span className="font-mono text-xs">{itemId}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">Mint (preview)</span>
          <span className="font-mono text-xs">{nftMint}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/profile?tab=inventory" className="btn-secondary">
          View inventory
        </Link>
        <Link href="/market" className="btn-secondary">
          Browse market
        </Link>
        <button type="button" onClick={onReset} className="btn-primary">
          Sell another device
        </button>
      </div>
    </div>
  );
}