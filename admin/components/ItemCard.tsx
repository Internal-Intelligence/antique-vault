import { CONDITIONS } from "../lib/anchor";

interface ItemRecord {
  itemId: string;
  name: string;
  nftMint: { toString(): string };
  condition: number;
  appraisedValueUsdCents: { toNumber(): number };
  status: number;
  mintedAt: { toNumber(): number };
}

const STATUS_LABEL = ["In Vault", "Redeemed"];
const STATUS_COLOR = ["text-green-400", "text-red-400"];

export default function ItemCard({ item }: { item: ItemRecord }) {
  const mintStr = item.nftMint.toString();
  const valueUsd = (item.appraisedValueUsdCents.toNumber() / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  const mintedDate = new Date(item.mintedAt.toNumber() * 1000).toLocaleDateString();

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 hover:border-amber-500/40 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-white leading-tight">{item.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{item.itemId}</p>
        </div>
        <span className={`text-xs font-medium ${STATUS_COLOR[item.status]}`}>
          {STATUS_LABEL[item.status]}
        </span>
      </div>

      <div className="space-y-1.5 text-sm mb-4">
        <Row label="Condition" value={CONDITIONS[item.condition]} />
        <Row label="Appraised" value={valueUsd} amber />
        <Row label="Minted" value={mintedDate} />
        <div className="flex justify-between">
          <span className="text-gray-500">NFT Mint</span>
          <span className="text-gray-300 font-mono text-xs">
            {mintStr.slice(0, 6)}...{mintStr.slice(-4)}
          </span>
        </div>
      </div>

      <a
        href={`https://explorer.solana.com/address/${mintStr}?cluster=devnet`}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center text-xs py-1.5 border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 rounded transition-colors"
      >
        View on Explorer →
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
