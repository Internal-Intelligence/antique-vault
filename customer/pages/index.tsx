import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import Layout from "../components/Layout";
import VaultItemCard from "../components/VaultItemCard";
import { getProgram } from "../lib/anchor";
import { fetchOwnedVaultItems, VaultItem } from "../lib/fetchOwnedItems";

type Modal = "store" | "list" | null;

export default function Portfolio() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [listItem, setListItem] = useState<VaultItem | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) loadItems();
  }, [wallet.connected, wallet.publicKey]);

  async function loadItems() {
    if (!wallet.publicKey) return;
    setLoading(true);
    try {
      const program = getProgram(wallet, connection);
      const owned = await fetchOwnedVaultItems(program, connection, wallet.publicKey);
      setItems(owned);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function openList(item: VaultItem) {
    setListItem(item);
    setModal("list");
  }

  function copyMint(mint: string) {
    navigator.clipboard.writeText(mint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inVault = items.filter((i) => i.status === 0).length;
  const totalValue = items.reduce((s, i) => s + i.appraisedValueUsdCents, 0) / 100;

  return (
    <Layout>
      {!wallet.connected ? (
        /* ── Hero / connect prompt ── */
        <div className="text-center py-28">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
            Own the Real Thing
          </h1>
          <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
            Every NFT in The Vault represents a physical antique held securely in our warehouse.
            Buy, hold, redeem for the physical item, or sell — your call.
          </p>
          <p className="text-sm text-gray-600">Connect your Solana wallet to view your items</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-500" />
        </div>
      ) : (
        <>
          {/* Portfolio summary */}
          {items.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-10">
              {[
                { label: "Items Owned", value: String(items.length) },
                { label: "In Vault", value: String(inVault), green: true },
                {
                  label: "Portfolio Value",
                  value: totalValue.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  }),
                  amber: true,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-[#141414] border border-white/5 rounded-xl p-4 text-center"
                >
                  <p className="text-gray-600 text-xs mb-1">{s.label}</p>
                  <p
                    className={`text-2xl font-bold ${
                      s.amber ? "text-amber-400" : s.green ? "text-green-400" : "text-white"
                    }`}
                  >
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Grid or empty state */}
          {items.length === 0 ? (
            <div className="text-center py-20 text-gray-600">
              <p className="text-lg mb-2">No vault items yet</p>
              <p className="text-sm">
                Purchase a Vault NFT to see your items here.
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Your Collection</h2>
                <button
                  onClick={loadItems}
                  className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                >
                  Refresh
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((item) => (
                  <VaultItemCard
                    key={item.nftMint}
                    item={item}
                    onStore={() => setModal("store")}
                    onList={() => openList(item)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Store modal ── */}
      {modal === "store" && (
        <Modal onClose={() => setModal(null)}>
          <div className="text-center">
            <div className="text-3xl mb-4">🏦</div>
            <h2 className="text-xl font-bold mb-3">Storage Details</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Your item is already safely stored in our climate-controlled warehouse.
              No action required — just hold your NFT.
            </p>
            <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-4 text-sm text-left mb-4 space-y-2">
              <Row label="Storage fee" value="$9.99 / month" />
              <Row label="Insurance" value="Included up to appraised value" />
              <Row label="Billing" value="Monthly via Stripe to email on file" />
              <Row label="Access" value="Redeem anytime by burning your NFT" />
            </div>
            <p className="text-xs text-gray-600">
              You'll receive a monthly invoice via email. Missing two consecutive payments
              initiates a forced sale at appraised value to cover costs.
            </p>
          </div>
        </Modal>
      )}

      {/* ── List modal ── */}
      {modal === "list" && listItem && (
        <Modal onClose={() => { setModal(null); setListItem(null); }}>
          <div className="text-center">
            <div className="text-3xl mb-4">🏷️</div>
            <h2 className="text-xl font-bold mb-1">List for Sale</h2>
            <p className="text-gray-500 text-sm mb-5">
              Sell your NFT on a secondary marketplace. The new owner inherits
              full custody rights to the physical item.
            </p>
            <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-4 text-sm text-left mb-5 space-y-2">
              <Row label="Item" value={listItem.name} />
              <Row label="NFT Royalty" value="5% on every sale" />
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Mint Address</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-gray-400">
                    {listItem.nftMint.slice(0, 8)}...{listItem.nftMint.slice(-6)}
                  </span>
                  <button
                    onClick={() => copyMint(listItem.nftMint)}
                    className="text-xs text-amber-500 hover:text-amber-400"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <a
                href={`https://magiceden.io/item-details/${listItem.nftMint}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2.5 bg-purple-700 hover:bg-purple-600 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                List on Magic Eden
              </a>
              <a
                href={`https://tensor.trade/item/${listItem.nftMint}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2.5 border border-white/10 hover:border-white/20 text-gray-300 text-sm rounded-lg transition-colors"
              >
                List on Tensor
              </a>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#141414] border border-white/10 rounded-2xl p-6 max-w-sm w-full z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-white text-xl"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="text-gray-200">{value}</span>
    </div>
  );
}
