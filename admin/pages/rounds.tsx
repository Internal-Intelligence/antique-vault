import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import Layout from "../components/Layout";

const ACQ_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_ACQ_PROGRAM_ID || "BLtdqGyjYZ7H5WjqVG2EtvY4TGxVpAqd8gBE4ZvydVHg"
);

const ACQ_IDL = {
  address: "BLtdqGyjYZ7H5WjqVG2EtvY4TGxVpAqd8gBE4ZvydVHg",
  version: "0.1.0",
  name: "acquisition_units",
  instructions: [
    {
      name: "createRound",
      accounts: [
        { name: "round", isMut: true, isSigner: false },
        { name: "unitMint", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "rent", isMut: false, isSigner: false },
      ],
      args: [
        { name: "roundId", type: "u32" },
        { name: "targetLamports", type: "u64" },
        { name: "unitPriceLamports", type: "u64" },
        { name: "description", type: "string" },
      ],
    },
    {
      name: "closeRound",
      accounts: [
        { name: "round", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "roundId", type: "u32" }],
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

function getAcqProgram(wallet: any, connection: any) {
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  return new Program(ACQ_IDL as any, provider) as any;
}

function getRoundPda(authority: PublicKey, roundId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("round"), authority.toBuffer(), Buffer.from(new Uint32Array([roundId]).buffer)],
    ACQ_PROGRAM_ID
  );
}

function getUnitMintPda(authority: PublicKey, roundId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("unit-mint"), authority.toBuffer(), Buffer.from(new Uint32Array([roundId]).buffer)],
    ACQ_PROGRAM_ID
  );
}

export default function Rounds() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    roundId: "1",
    targetSol: "",
    unitPriceSol: "0.1",
    description: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) fetchRounds();
  }, [wallet.connected, wallet.publicKey]);

  async function fetchRounds() {
    if (!wallet.publicKey) return;
    setLoading(true);
    try {
      const program = getAcqProgram(wallet, connection);
      const all = await program.account.acquisitionRound.all([
        { memcmp: { offset: 8, bytes: wallet.publicKey.toBase58() } },
      ]);
      setRounds(all.map((a) => a.account).sort((a: any, b: any) => b.roundId - a.roundId));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!wallet.publicKey) return;
    setError("");
    setCreating(true);
    try {
      const program = getAcqProgram(wallet, connection);
      const roundId = parseInt(form.roundId);
      const [roundPda] = getRoundPda(wallet.publicKey, roundId);
      const [unitMintPda] = getUnitMintPda(wallet.publicKey, roundId);
      const { SYSVAR_RENT_PUBKEY } = await import("@solana/web3.js");

      await program.methods
        .createRound(
          roundId,
          new BN(Math.round(parseFloat(form.targetSol) * LAMPORTS_PER_SOL)),
          new BN(Math.round(parseFloat(form.unitPriceSol) * LAMPORTS_PER_SOL)),
          form.description
        )
        .accounts({
          round: roundPda,
          unitMint: unitMintPda,
          authority: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      setForm({ roundId: String(roundId + 1), targetSol: "", unitPriceSol: "0.1", description: "" });
      fetchRounds();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleClose(roundId: number) {
    if (!wallet.publicKey || !confirm("Close this round and withdraw all raised SOL?")) return;
    try {
      const program = getAcqProgram(wallet, connection);
      const [roundPda] = getRoundPda(wallet.publicKey, roundId);
      await program.methods
        .closeRound(roundId)
        .accounts({
          round: roundPda,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      fetchRounds();
    } catch (err: any) {
      alert(err.message);
    }
  }

  const STATUS_LABEL = ["Open", "Closed"];
  const STATUS_COLOR = ["text-green-400", "text-gray-500"];

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Acquisition Rounds</h1>
          <p className="text-gray-500 text-sm mt-1">
            Customers fund buying runs — receive UNIT tokens as proof of participation
          </p>
        </div>
      </div>

      {!wallet.connected ? (
        <p className="text-gray-500">Connect your wallet.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create form */}
          <div className="lg:col-span-1">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
              <h2 className="font-semibold text-sm text-gray-300 uppercase tracking-wider mb-4">
                New Round
              </h2>
              {error && (
                <p className="text-red-400 text-sm mb-3 bg-red-900/20 rounded px-3 py-2">{error}</p>
              )}
              <form onSubmit={handleCreate} className="space-y-3">
                {[
                  { label: "Round ID", key: "roundId", placeholder: "1" },
                  { label: "Target (SOL)", key: "targetSol", placeholder: "10" },
                  { label: "Unit Price (SOL)", key: "unitPriceSol", placeholder: "0.1" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 mb-1">{label}</label>
                    <input
                      value={(form as any)[key]}
                      onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Sourcing matchbox cars at the Texas estate sale..."
                    rows={3}
                    className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 resize-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold rounded-lg text-sm"
                >
                  {creating ? "Creating..." : "Create Round"}
                </button>
              </form>
            </div>
          </div>

          {/* Rounds list */}
          <div className="lg:col-span-2">
            {loading ? (
              <p className="text-gray-500">Loading rounds...</p>
            ) : rounds.length === 0 ? (
              <div className="text-center py-16 text-gray-600 border border-dashed border-[#2a2a2a] rounded-xl">
                No rounds yet. Create your first acquisition round.
              </div>
            ) : (
              <div className="space-y-4">
                {rounds.map((r: any) => {
                  const targetSol = r.targetLamports.toNumber() / LAMPORTS_PER_SOL;
                  const raisedSol = r.raisedLamports.toNumber() / LAMPORTS_PER_SOL;
                  const pct = targetSol > 0 ? Math.min(100, (raisedSol / targetSol) * 100) : 0;

                  return (
                    <div
                      key={r.roundId}
                      className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold">Round #{r.roundId}</h3>
                            <span className={`text-xs ${STATUS_COLOR[r.status]}`}>
                              {STATUS_LABEL[r.status]}
                            </span>
                          </div>
                          <p className="text-gray-500 text-sm mt-0.5">{r.description}</p>
                        </div>
                        {r.status === 0 && (
                          <button
                            onClick={() => handleClose(r.roundId)}
                            className="text-xs border border-red-800/50 text-red-400 hover:bg-red-900/20 px-3 py-1 rounded"
                          >
                            Close & Withdraw
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm mb-4">
                        <Stat label="Target" value={`${targetSol} SOL`} />
                        <Stat label="Raised" value={`${raisedSol} SOL`} amber />
                        <Stat label="Units Sold" value={String(r.unitsSold.toNumber())} />
                      </div>

                      <div className="bg-[#0f0f0f] rounded-lg overflow-hidden h-2">
                        <div
                          className="bg-amber-500 h-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1 text-right">{pct.toFixed(1)}% funded</p>

                      <div className="mt-3 pt-3 border-t border-[#2a2a2a] text-xs text-gray-600">
                        Unit Mint:{" "}
                        <span className="font-mono">
                          {r.unitMint.toString().slice(0, 8)}...{r.unitMint.toString().slice(-6)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}

function Stat({ label, value, amber }: { label: string; value: string; amber?: boolean }) {
  return (
    <div>
      <p className="text-gray-600 text-xs mb-0.5">{label}</p>
      <p className={amber ? "text-amber-400 font-semibold" : "text-gray-200"}>{value}</p>
    </div>
  );
}
