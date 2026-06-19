import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import Layout from "../components/Layout";
import ItemCard from "../components/ItemCard";
import { getProgram, getVaultPda } from "../lib/anchor";
import { SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

export default function Dashboard() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [items, setItems] = useState<any[]>([]);
  const [vaultExists, setVaultExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [stats, setStats] = useState({ total: 0, inVault: 0, redeemed: 0, valueUsd: 0 });

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      fetchInventory();
    }
  }, [wallet.connected, wallet.publicKey]);

  async function fetchInventory() {
    if (!wallet.publicKey) return;
    setLoading(true);
    try {
      const program = getProgram(wallet, connection);
      const [vaultPda] = getVaultPda(wallet.publicKey);

      // Check vault exists
      try {
        await program.account.vault.fetch(vaultPda);
        setVaultExists(true);
      } catch {
        setVaultExists(false);
        setLoading(false);
        return;
      }

      // Fetch all items belonging to this vault (filter by vault pubkey at offset 8)
      const itemAccounts = await program.account.itemRecord.all([
        {
          memcmp: {
            offset: 8,
            bytes: vaultPda.toBase58(),
          },
        },
      ]);

      const fetched = itemAccounts.map((a) => a.account);
      setItems(fetched);

      const inVault = fetched.filter((i) => i.status === 0).length;
      const totalValue = fetched.reduce(
        (sum: number, i: any) => sum + i.appraisedValueUsdCents.toNumber(),
        0
      );
      setStats({
        total: fetched.length,
        inVault,
        redeemed: fetched.length - inVault,
        valueUsd: totalValue / 100,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function initVault() {
    if (!wallet.publicKey) return;
    setInitializing(true);
    try {
      const program = getProgram(wallet, connection);
      const [vaultPda] = getVaultPda(wallet.publicKey);
      await program.methods
        .initializeVault()
        .accounts({
          vault: vaultPda,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setVaultExists(true);
      fetchInventory();
    } catch (e: any) {
      alert("Failed to initialize vault: " + e.message);
    } finally {
      setInitializing(false);
    }
  }

  return (
    <Layout>
      {!wallet.connected ? (
        <div className="text-center py-24 text-gray-500">
          <p className="text-lg mb-2">Connect your wallet to manage inventory</p>
          <p className="text-sm">Use the button in the top right</p>
        </div>
      ) : vaultExists === false ? (
        <div className="text-center py-24">
          <p className="text-gray-400 mb-6">
            No vault found for this wallet. Initialize it to start minting.
          </p>
          <button
            onClick={initVault}
            disabled={initializing}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold px-6 py-3 rounded-lg"
          >
            {initializing ? "Initializing..." : "Initialize Vault"}
          </button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Items", value: stats.total },
              { label: "In Vault", value: stats.inVault, green: true },
              { label: "Redeemed", value: stats.redeemed },
              {
                label: "Total Value",
                value: stats.valueUsd.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                }),
                amber: true,
              },
            ].map((s) => (
              <div key={s.label} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                <p className="text-gray-500 text-xs mb-1">{s.label}</p>
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

          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-semibold">Vault Inventory</h1>
            <div className="flex gap-3">
              <button
                onClick={fetchInventory}
                className="text-sm text-gray-400 hover:text-white border border-[#2a2a2a] px-3 py-1.5 rounded-lg"
              >
                Refresh
              </button>
              <Link
                href="/intake"
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm px-4 py-1.5 rounded-lg"
              >
                + Intake Item
              </Link>
            </div>
          </div>

          {/* Items grid */}
          {loading ? (
            <p className="text-gray-500">Loading inventory...</p>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-gray-500 border border-dashed border-[#2a2a2a] rounded-xl">
              <p>No items minted yet.</p>
              <Link href="/intake" className="text-amber-500 hover:underline text-sm mt-2 block">
                Intake your first item →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((item, i) => (
                <ItemCard key={i} item={item} />
              ))}
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
