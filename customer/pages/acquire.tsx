import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import { requireIdVerification } from "../lib/anchor";
import Link from "next/link";

const ACQ_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_ACQ_PROGRAM_ID || "BLtdqGyjYZ7H5WjqVG2EtvY4TGxVpAqd8gBE4ZvydVHg"
);

// ═══════════════════════════════════════════════════════════════════════════
// ACQUIRE — Community funds the next wave of AI-valued e-waste
// Units give skin in the game + priority on fresh inventory
// ═══════════════════════════════════════════════════════════════════════════
// Minimal IDL — customer only needs buyUnits
const IDL = {
  address: "BLtdqGyjYZ7H5WjqVG2EtvY4TGxVpAqd8gBE4ZvydVHg",
  version: "0.1.0",
  name: "acquisition_units",
  instructions: [
    {
      name: "buyUnits",
      accounts: [
        { name: "round", isMut: true, isSigner: false },
        { name: "unitMint", isMut: true, isSigner: false },
        { name: "buyerTokenAccount", isMut: true, isSigner: false },
        { name: "buyer", isMut: true, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "associatedTokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "roundId", type: "u32" },
        { name: "unitCount", type: "u64" },
      ],
    },
  ],
  accounts: [
    {
      name: "AcquisitionRound",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "publicKey" },
          { name: "roundId", type: "u32" },
          { name: "targetLamports", type: "u64" },
          { name: "raisedLamports", type: "u64" },
          { name: "unitPriceLamports", type: "u64" },
          { name: "unitsSold", type: "u64" },
          { name: "description", type: "string" },
          { name: "status", type: "u8" },
          { name: "unitMint", type: "publicKey" },
          { name: "bump", type: "u8" },
          { name: "mintBump", type: "u8" },
        ],
      },
    },
  ],
  errors: [],
} as const;

function getProgram(wallet: any, connection: any) {
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  return new Program(IDL as any, provider) as any;
}

function getRoundPda(authority: PublicKey, roundId: number) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("round"), authority.toBuffer(), Buffer.from(new Uint32Array([roundId]).buffer)],
    ACQ_PROGRAM_ID
  )[0];
}

function getUnitMintPda(authority: PublicKey, roundId: number) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("unit-mint"), authority.toBuffer(), Buffer.from(new Uint32Array([roundId]).buffer)],
    ACQ_PROGRAM_ID
  )[0];
}

export default function AcquirePage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [buyingId, setBuyingId] = useState<number | null>(null);
  const [unitCount, setUnitCount] = useState<Record<number, string>>({});
  const [error, setError] = useState<Record<number, string>>({});

  useEffect(() => {
    loadRounds();
  }, []);

  async function loadRounds() {
    setLoading(true);
    try {
      // Fetch all open acquisition rounds across all vaults
      const allAccounts = await connection.getProgramAccounts(ACQ_PROGRAM_ID, {
        filters: [{ dataSize: 243 }],
      });
      // Decode using a read-only provider
      const provider = new AnchorProvider(connection, { publicKey: PublicKey.default } as any, {});
      const program = new Program(IDL as any, provider) as any;

      const decoded = await Promise.all(
        allAccounts.map(async ({ pubkey, account }) => {
          try {
            const decoded = program.coder.accounts.decode("AcquisitionRound", account.data);
            return { pubkey, ...decoded };
          } catch {
            return null;
          }
        })
      );

      setRounds(
        decoded
          .filter(Boolean)
          .filter((r: any) => r.status === 0)
          .sort((a: any, b: any) => b.roundId - a.roundId)
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleBuy(round: any) {
    if (!wallet.connected || !wallet.publicKey) return;
    const count = parseInt(unitCount[round.roundId] || "1");
    if (!count || count < 1) return;

    setError((p) => ({ ...p, [round.roundId]: "" }));
    setBuyingId(round.roundId);
    try {
      const program = getProgram(wallet, connection);
      const roundPda = getRoundPda(round.authority, round.roundId);
      const unitMintPda = getUnitMintPda(round.authority, round.roundId);

      const { getAssociatedTokenAddressSync } = await import("@solana/spl-token");
      const buyerAta = getAssociatedTokenAddressSync(unitMintPda, wallet.publicKey);

      await program.methods
        .buyUnits(round.roundId, new BN(count))
        .accounts({
          round: roundPda,
          unitMint: unitMintPda,
          buyerTokenAccount: buyerAta,
          buyer: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      loadRounds();
    } catch (err: any) {
      setError((p) => ({ ...p, [round.roundId]: err.message }));
    } finally {
      setBuyingId(null);
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-3">
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              Acquisition Rounds
            </span>
          </h1>
          <p className="text-gray-500 leading-relaxed">
            Fund inventory acquisition rounds. AI prices incoming RWAs. Units grant priority access when items are minted as NFTs. First in, first pick.
          </p>
        </div>

        <div className="bg-[#141414] border border-white/5 rounded-xl p-4 mb-8">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            {[
              { step: "1", label: "Buy units with SOL" },
              { step: "2", label: "We source RWAs" },
              { step: "3", label: "Priority NFT access" },
            ].map(({ step, label }) => (
              <div key={step}>
                <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center mx-auto mb-2">
                  {step}
                </div>
                <p className="text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-500" />
          </div>
        ) : rounds.length === 0 ? (
          <div className="text-center py-16 text-gray-600 border border-dashed border-white/5 rounded-xl">
            No active acquisition rounds right now. Check back soon.
          </div>
        ) : (
          <div className="space-y-5">
            {rounds.map((r: any) => {
              const targetSol = r.targetLamports.toNumber() / LAMPORTS_PER_SOL;
              const raisedSol = r.raisedLamports.toNumber() / LAMPORTS_PER_SOL;
              const unitPriceSol = r.unitPriceLamports.toNumber() / LAMPORTS_PER_SOL;
              const pct = targetSol > 0 ? Math.min(100, (raisedSol / targetSol) * 100) : 0;
              const count = parseInt(unitCount[r.roundId] || "1") || 1;
              const totalCost = (unitPriceSol * count).toFixed(4);

              return (
                <div
                  key={r.roundId}
                  className="bg-[#141414] border border-white/5 hover:border-amber-500/20 rounded-2xl p-6 transition-colors"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h2 className="font-semibold text-white">Round #{r.roundId}</h2>
                    <span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full">
                      Open
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mb-4">{r.description}</p>

                  <div className="grid grid-cols-3 gap-3 text-sm mb-4">
                    <Stat label="Unit Price" value={`${unitPriceSol} SOL`} />
                    <Stat label="Raised" value={`${raisedSol} / ${targetSol} SOL`} amber />
                    <Stat label="Units Sold" value={String(r.unitsSold.toNumber())} />
                  </div>

                  <div className="bg-[#0f0f0f] rounded-full overflow-hidden h-1.5 mb-1">
                    <div
                      className="bg-amber-500 h-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-700 mb-5 text-right">{pct.toFixed(1)}% funded</p>

                  {error[r.roundId] && (
                    <p className="text-red-400 text-xs mb-3 bg-red-900/20 rounded px-3 py-2">
                      {error[r.roundId]}
                    </p>
                  )}

                  {wallet.connected ? (
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-gray-600 mb-1 block">Units to buy</label>
                        <input
                          type="number"
                          min="1"
                          value={unitCount[r.roundId] || "1"}
                          onChange={(e) =>
                            setUnitCount((p) => ({ ...p, [r.roundId]: e.target.value }))
                          }
                          className="w-full bg-[#0f0f0f] border border-white/8 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-gray-600 mb-1 block">Total cost</label>
                        <div className="bg-[#0f0f0f] border border-white/5 rounded-lg px-3 py-2 text-sm text-amber-400 font-semibold">
                          {totalCost} SOL
                        </div>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => { requireIdVerification("acquire-unit", "buy-acq"); handleBuy(r); }}
                          disabled={buyingId === r.roundId}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold rounded-lg text-sm whitespace-nowrap casino-btn"
                        >
                          {buyingId === r.roundId ? "Buying..." : "Buy units"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm text-center py-2">
                      Connect wallet to participate
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="casino-section mt-12 pt-8 border-t border-white/10">
          <h2 className="text-xl font-semibold mb-1">Promote your listing</h2>
          <p className="text-sm text-gray-500 mb-4">
            Increase visibility with a paid listing boost. Featured placement in search results and category pages.
          </p>
          <div className="casino-card border border-white/10 p-6">
            <p className="text-sm text-gray-400 mb-4">
              Paid boosts are coming soon. List your item now and opt in when promotion is available.
            </p>
            <Link
              href="/sell"
              className="inline-flex w-full items-center justify-center py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl casino-btn transition-colors"
            >
              List an item →
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Stat({ label, value, amber }: { label: string; value: string; amber?: boolean }) {
  return (
    <div>
      <p className="text-gray-600 text-xs mb-0.5">{label}</p>
      <p className={amber ? "text-amber-400 font-medium" : "text-gray-300 text-sm"}>{value}</p>
    </div>
  );
}
