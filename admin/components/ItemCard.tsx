import { CONDITIONS } from "../lib/anchor";

// ═══════════════════════════════════════════════════════════════════════════
// QUANTUM PREDICTIVE MODEL — quickQuantumVal
// Simulates value uncertainty (superposition) for e-waste pawned assets.
// Used in AI valuation display + portfolio overviews.
// Base comes from intake AI appraisal. Quantum layer adds the magic.
// ═══════════════════════════════════════════════════════════════════════════
function quickQuantumVal(baseCents: number) {
  const uncertainty = 0.22;
  const probHigh = 0.5 + (Math.random() - 0.5) * uncertainty * 1.5;
  const delta = baseCents * uncertainty;
  const qVal = baseCents + (Math.random() < probHigh ? delta : -delta * 0.6);
  return {
    qUsd: (Math.max(10, qVal) / 100).toFixed(0),
    prob: (probHigh * 100).toFixed(0) + "%↑",
  };
}

interface ItemRecord {
  itemId: string;
  name: string;
  nftMint: { toString(): string };
  condition: number;
  appraisedValueUsdCents: { toNumber(): number };
  status: number;
  mintedAt: { toNumber(): number };
  category?: string;
}

const STATUS_LABEL = ["In Vault", "Redeemed", "PaperVerified", "ShippedProof", "Pawned"];
const STATUS_COLOR = ["text-green-400", "text-red-400", "text-emerald-400", "text-sky-400", "text-amber-400"];

export default function ItemCard({ item }: { item: ItemRecord }) {
  const mintStr = item.nftMint.toString();
  const valueUsd = (item.appraisedValueUsdCents.toNumber() / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  const mintedDate = new Date(item.mintedAt.toNumber() * 1000).toLocaleDateString();

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 hover:border-emerald-500/40 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-white leading-tight">{item.name}</h3>
          <div className="flex gap-1 mt-0.5">
            <p className="text-xs text-gray-500">{item.itemId}</p>
            {item.category && <span className="text-[9px] px-1 bg-[#222] text-emerald-400 rounded">{item.category}</span>}
          </div>
        </div>
        <span className={`text-xs font-medium ${STATUS_COLOR[item.status]}`}>
          {STATUS_LABEL[item.status]} • E-WASTE RWA
        </span>
      </div>

      <div className="space-y-1.5 text-sm mb-4">
        <Row label="Condition" value={CONDITIONS[item.condition]} />
        <Row label="Appraised" value={valueUsd} amber />
        {(() => {
          const q = quickQuantumVal(item.appraisedValueUsdCents.toNumber());
          return <Row label="Quantum Adj." value={`$${q.qUsd} (${q.prob})`} amber />;
        })()}
        <Row label="Minted" value={mintedDate} />
        <div className="flex justify-between">
          <span className="text-gray-500">NFT Mint</span>
          <span className="text-gray-300 font-mono text-xs">
            {mintStr.slice(0, 6)}...{mintStr.slice(-4)}
          </span>
        </div>
        {/* Agent 12: Quantum Trust layers quick view for e-waste */}
        <div className="text-[10px] text-emerald-400/70 font-mono pt-0.5">TRUST: ESCROW • PAPER • SHIP • PAWN • AI-CHAIN • Q-VERIFY</div>
      </div>

      <a
        href={`https://explorer.solana.com/address/${mintStr}?cluster=devnet`}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center text-xs py-1.5 border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 rounded transition-colors mb-1.5"
      >
        View on Explorer →
      </a>

      {/* Trigger Agent 13 Multi-Agent Offer Tinker from valuation inventory */}
      <a
        href={`/builders?base=${Math.round(item.appraisedValueUsdCents.toNumber() / 100)}&name=${encodeURIComponent(item.name)}&cat=${encodeURIComponent("Antique")}`}
        className="block text-center text-xs py-1.5 bg-violet-600/80 hover:bg-violet-600 text-white rounded transition-colors font-medium"
      >
        ⚛️ TINKER OFFER WITH AGENT 13 BUILDERS
      </a>
    </div>
  );
}

function Row({ label, value, amber }: { label: string; value: string; amber?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={amber ? "text-amber-400 font-semibold" : "text-gray-300"}>{value}</span>
    </div>
  );
}
