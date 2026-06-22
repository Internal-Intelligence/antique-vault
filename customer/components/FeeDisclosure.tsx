interface FeeDisclosureProps {
  compact?: boolean;
  promoted?: boolean;
}

export default function FeeDisclosure({ compact = false, promoted = false }: FeeDisclosureProps) {
  const platformPct = promoted ? "8%" : "5%";

  if (compact) {
    return (
      <p className="text-xs text-zinc-500">
        NFTBAY fee: <span className="text-zinc-400">{platformPct}</span> per sale
        {promoted && " (promoted)"}.{" "}
        <a href="/fees" className="text-emerald-500/90 hover:text-emerald-400 underline-offset-2 hover:underline">
          Fee details
        </a>
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-4 text-sm">
      <p className="font-medium text-zinc-200 mb-2">How fees work</p>
      <ul className="space-y-1.5 text-zinc-500">
        <li>
          <span className="text-zinc-300">Standard listing:</span> {platformPct} platform fee on completed sales
        </li>
        <li>
          <span className="text-zinc-300">Promoted listing:</span> 8% platform fee + optional boost packages
        </li>
        <li>
          <span className="text-zinc-300">Pawn:</span> small fee on interest when you repay (principal untouched)
        </li>
      </ul>
      <a href="/fees" className="inline-block mt-3 text-emerald-500 text-xs hover:text-emerald-400">
        View full fee schedule →
      </a>
    </div>
  );
}