import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { VaultItem } from "../lib/fetchOwnedItems";
import { fetchNftImage } from "../lib/burn";
import { CONDITIONS } from "../lib/anchor";

interface Props {
  item: VaultItem;
  onStore: () => void;
  onList: () => void;
}

export default function VaultItemCard({ item, onStore, onList }: Props) {
  const { connection } = useConnection();
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    fetchNftImage(item.nftMint, connection.rpcEndpoint).then(setImage);
  }, [item.nftMint]);

  const valueUsd = (item.appraisedValueUsdCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  const isRedeemed = item.status === 1;

  return (
    <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden hover:border-amber-500/20 transition-all group">
      {/* Image */}
      <div className="aspect-square bg-[#1a1a1a] relative overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-700">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="absolute top-2 right-2">
          {isRedeemed ? (
            <span className="bg-red-900/80 text-red-300 text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
              Redeemed
            </span>
          ) : (
            <span className="bg-green-900/80 text-green-300 text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
              In Vault
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white leading-snug mb-1">{item.name}</h3>
        <p className="text-gray-600 text-xs mb-3">{item.itemId}</p>

        <div className="flex justify-between text-sm mb-4">
          <div>
            <p className="text-gray-600 text-xs">Condition</p>
            <p className="text-gray-300">{CONDITIONS[item.condition]}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-600 text-xs">Appraised</p>
            <p className="text-amber-400 font-semibold">{valueUsd}</p>
          </div>
        </div>

        {/* Action buttons */}
        {isRedeemed ? (
          <p className="text-center text-xs text-gray-600 py-2">
            Shipment in progress — check your email for tracking
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <Link
              href={`/redeem/${item.nftMint}`}
              className="text-center text-xs py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors"
            >
              Redeem
            </Link>
            <button
              onClick={onStore}
              className="text-xs py-2 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              Store
            </button>
            <button
              onClick={onList}
              className="text-xs py-2 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              List
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
