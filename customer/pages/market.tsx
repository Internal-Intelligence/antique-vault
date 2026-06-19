import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import Link from "next/link";
import Layout from "../components/Layout";
import { getProgram, CONDITIONS, PROGRAM_ID } from "../lib/anchor";
import { fetchNftImage } from "../lib/burn";

// ── Simple escrow-free marketplace: listings stored on-chain via a Listing PDA ──
// Uses a companion program (marketplace). For this MVP we store listings in a
// separate program account. If the marketplace program isn't deployed yet, the
// page falls back to showing all vault items with Magic Eden / Tensor links.

interface Listing {
  nftMint: string;
  name: string;
  condition: number;
  appraisedValueUsdCents: number;
  image: string | null;
  itemId: string;
}

export default function Marketplace() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<number | null>(null);

  useEffect(() => {
    loadListings();
  }, []);

  async function loadListings() {
    setLoading(true);
    try {
      // Read all InVault items from the antique-vault program — treat them as browseable
      const provider = new AnchorProvider(
        connection,
        { publicKey: PublicKey.default, signTransaction: async (t: any) => t, signAllTransactions: async (t: any) => t } as any,
        {}
      );
      const program = new Program(
        (await import("../lib/idl")).IDL as any,
        provider
      ) as any;

      const allRecords = await program.account.itemRecord.all();
      const inVault = allRecords.filter(({ account }) => account.status === 0);

      // Fetch images lazily
      const base: Listing[] = inVault.map(({ account }) => ({
        nftMint: account.nftMint.toString(),
        name: account.name,
        condition: account.condition,
        appraisedValueUsdCents: account.appraisedValueUsdCents.toNumber(),
        image: null,
        itemId: account.itemId,
      }));
      setListings(base);
      setLoading(false);

      // Hydrate images in background
      for (const item of base) {
        fetchNftImage(item.nftMint, connection.rpcEndpoint).then((img) => {
          if (img) {
            setListings((prev) =>
              prev.map((l) => (l.nftMint === item.nftMint ? { ...l, image: img } : l))
            );
          }
        });
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  const filtered = listings.filter((l) => {
    const matchSearch =
      !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.itemId.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === null || l.condition === filter;
    return matchSearch && matchFilter;
  });

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
            Marketplace
          </span>
        </h1>
        <p className="text-gray-500">
          Browse tokenized antiques available in The Vault. Each NFT = one physical item.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          placeholder="Search by name or item ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-[#141414] border border-white/8 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/50 placeholder:text-gray-700"
        />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter(null)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              filter === null
                ? "border-amber-500 text-amber-400 bg-amber-500/10"
                : "border-white/8 text-gray-500 hover:text-gray-300"
            }`}
          >
            All
          </button>
          {CONDITIONS.map((c, i) => (
            <button
              key={c}
              onClick={() => setFilter(filter === i ? null : i)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                filter === i
                  ? "border-amber-500 text-amber-400 bg-amber-500/10"
                  : "border-white/8 text-gray-500 hover:text-gray-300"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-gray-600">
          {listings.length === 0 ? "No items in the vault yet." : "No items match your search."}
        </div>
      ) : (
        <>
          <p className="text-gray-600 text-sm mb-4">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((item) => (
              <MarketCard key={item.nftMint} item={item} />
            ))}
          </div>
        </>
      )}
    </Layout>
  );
}

function MarketCard({ item }: { item: Listing }) {
  const [copied, setCopied] = useState(false);
  const valueUsd = (item.appraisedValueUsdCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  function copy() {
    navigator.clipboard.writeText(item.nftMint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden hover:border-amber-500/20 transition-all group">
      {/* Image */}
      <div className="aspect-square bg-[#1a1a1a] relative">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-t border-gray-700 rounded-full animate-spin" />
          </div>
        )}
        <div className="absolute bottom-2 left-2 right-2 flex justify-between">
          <span className="bg-black/60 text-amber-400 text-xs px-2 py-0.5 rounded backdrop-blur-sm font-semibold">
            {valueUsd}
          </span>
          <span className="bg-black/60 text-gray-300 text-xs px-2 py-0.5 rounded backdrop-blur-sm">
            {CONDITIONS[item.condition]}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white text-sm leading-snug mb-1">{item.name}</h3>
        <p className="text-gray-700 text-xs mb-4">{item.itemId}</p>

        <div className="space-y-2">
          <a
            href={`https://magiceden.io/item-details/${item.nftMint}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-xs py-2 bg-purple-700/80 hover:bg-purple-600 text-white rounded-lg transition-colors"
          >
            Buy on Magic Eden
          </a>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`https://tensor.trade/item/${item.nftMint}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center text-xs py-1.5 border border-white/8 text-gray-500 hover:text-gray-300 rounded-lg transition-colors"
            >
              Tensor
            </a>
            <button
              onClick={copy}
              className="text-xs py-1.5 border border-white/8 text-gray-500 hover:text-gray-300 rounded-lg transition-colors"
            >
              {copied ? "Copied!" : "Copy Mint"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
