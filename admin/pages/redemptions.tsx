import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import Layout from "../components/Layout";
import { getProgram, getVaultPda, CONDITIONS } from "../lib/anchor";

interface RedemptionItem {
  itemId: string;
  name: string;
  nftMint: string;
  condition: number;
  appraisedValueUsdCents: number;
  shippingAddress: string;
  redeemedAt: number;
}

export default function Redemptions() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [items, setItems] = useState<RedemptionItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) fetchRedemptions();
  }, [wallet.connected, wallet.publicKey]);

  async function fetchRedemptions() {
    if (!wallet.publicKey) return;
    setLoading(true);
    try {
      const program = getProgram(wallet, connection);
      const [vaultPda] = getVaultPda(wallet.publicKey);

      const allItems = await program.account.itemRecord.all([
        { memcmp: { offset: 8, bytes: vaultPda.toBase58() } },
      ]);

      const redeemed = allItems
        .filter((a) => a.account.status === 1)
        .map(({ account }) => ({
          itemId: account.itemId,
          name: account.name,
          nftMint: account.nftMint.toString(),
          condition: account.condition,
          appraisedValueUsdCents: account.appraisedValueUsdCents.toNumber(),
          shippingAddress: account.shippingAddress,
          redeemedAt: account.redeemedAt.toNumber(),
        }))
        .sort((a, b) => b.redeemedAt - a.redeemedAt);

      setItems(redeemed);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Redemption Queue</h1>
          <p className="text-gray-500 text-sm mt-1">
            Items whose NFTs have been burned — awaiting physical shipment
          </p>
        </div>
        <button
          onClick={fetchRedemptions}
          className="text-sm text-gray-400 hover:text-white border border-[#2a2a2a] px-3 py-1.5 rounded-lg"
        >
          Refresh
        </button>
      </div>

      {!wallet.connected ? (
        <p className="text-gray-500">Connect your wallet to view redemptions.</p>
      ) : loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-500 border border-dashed border-[#2a2a2a] rounded-xl">
          No pending redemptions.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.itemId}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5"
            >
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                {/* Item info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-white">{item.name}</h3>
                    <span className="text-xs bg-red-900/40 text-red-400 border border-red-800/40 px-2 py-0.5 rounded-full">
                      Awaiting Shipment
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <Stat label="Item ID" value={item.itemId} />
                    <Stat label="Condition" value={CONDITIONS[item.condition]} />
                    <Stat
                      label="Value"
                      value={(item.appraisedValueUsdCents / 100).toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      })}
                      amber
                    />
                    <Stat
                      label="Redeemed"
                      value={new Date(item.redeemedAt * 1000).toLocaleDateString()}
                    />
                  </div>
                </div>

                {/* Shipping address */}
                <div className="md:w-72 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Ship to</p>
                  <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">
                    {item.shippingAddress || (
                      <span className="text-gray-600 italic">No address on record</span>
                    )}
                  </p>
                </div>
              </div>

              {/* NFT mint */}
              <div className="mt-3 pt-3 border-t border-[#2a2a2a] flex items-center justify-between text-xs text-gray-600">
                <span>
                  NFT:{" "}
                  <span className="font-mono">
                    {item.nftMint.slice(0, 8)}...{item.nftMint.slice(-8)}
                  </span>
                </span>
                <a
                  href={`https://explorer.solana.com/address/${item.nftMint}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 hover:text-amber-400"
                >
                  Explorer →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}

function Stat({
  label,
  value,
  amber,
}: {
  label: string;
  value: string;
  amber?: boolean;
}) {
  return (
    <div>
      <p className="text-gray-500 text-xs mb-0.5">{label}</p>
      <p className={amber ? "text-amber-400 font-semibold" : "text-gray-200"}>{value}</p>
    </div>
  );
}
