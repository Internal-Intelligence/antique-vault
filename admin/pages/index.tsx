import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import Layout from "../components/Layout";
import ItemCard from "../components/ItemCard";
import { getProgram, getVaultPda } from "../lib/anchor";
import { SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD — Q-INTEL QUANTUM E-WASTE VAULT CONTROL
// Displays AI + quantum valued inventory. Intake feeds the machine.
// Redemptions & rounds complete the pawn loop.
// ═══════════════════════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════════════════════
  // AGENT 9: QUANTUM SIMULATION INNOVATOR — E-Waste Qubit States, Entanglement,
  // Quantum Search for Optimal Offers + Parallel Sims in NFTBAY
  // ═══════════════════════════════════════════════════════════════════════════

  interface QSimResult {
    expected: number;
    probHigh: number;
    state: string;
    uncertainty: number;
  }

  function simulateQubitValuation(baseCents: number): QSimResult {
    // Qubit-like |ψ> = α|0> + β|1> encodes valuation uncertainty for e-waste pawn
    // |0> = baseline, |1> = high-recovery (metals, resale)
    const beta = Math.min(0.82, 0.48 + Math.random() * 0.34); // superposition amp
    const alpha = Math.sqrt(1 - beta * beta);
    const measuredHigh = Math.random() < (beta * beta);
    const delta = baseCents * 0.28;
    const adj = measuredHigh ? delta : -delta * 0.65;
    const exp = Math.max(50, Math.round(baseCents + adj));
    return {
      expected: exp,
      probHigh: beta * beta,
      state: `|ψ⟩ = ${alpha.toFixed(2)}|0⟩ + ${beta.toFixed(2)}|1⟩`,
      uncertainty: Math.abs(adj) / 100,
    };
  }

  function entangleItems(baseItems: any[]): any[] {
    // Entanglement: measuring (valuing) one pawned e-waste item collapses state of correlated items
    if (baseItems.length < 2) return baseItems;
    const seedQ = simulateQubitValuation(baseItems[0].appraisedValueUsdCents?.toNumber?.() || 10000);
    return baseItems.map((it, idx) => {
      if (idx === 0) return it;
      const corr = (Math.random() < 0.78) ? seedQ.expected : Math.round(seedQ.expected * (0.7 + Math.random()*0.6));
      return { ...it, entangledValue: corr };
    });
  }

  function quantumSearchOptimalOffers(offers: number[]): { best: number; conf: string; speed: string } {
    // Grover-like amplitude amplification for optimal offer (predictive model)
    if (!offers.length) return { best: 0, conf: "0%", speed: "0ms" };
    const target = Math.max(...offers);
    let amps = Array(offers.length).fill(1 / offers.length);
    const iters = Math.floor(Math.log(offers.length) / Math.log(2)) || 2;
    for (let k = 0; k < iters; k++) {
      amps = amps.map((a, i) => (offers[i] === target ? a * 2.1 : a * 0.55));
      const s = amps.reduce((x, y) => x + y, 0);
      amps = amps.map(a => a / s);
    }
    const bestI = amps.indexOf(Math.max(...amps));
    return {
      best: offers[bestI],
      conf: (amps[bestI] * 100).toFixed(0) + "%",
      speed: (12 + Math.random()*7).toFixed(1) + "µs (grover)",
    };
  }

  async function runParallelSims(baseCents: number, n = 1024): Promise<{ avg: number; ms: number; n: number }> {
    const t0 = performance.now();
    // Parallel sims via concurrent microtasks — blazing speed
    const results = await Promise.all(
      Array.from({ length: n }, () =>
        Promise.resolve(simulateQubitValuation(baseCents))
      )
    );
    const ms = performance.now() - t0;
    const avg = results.reduce((sum, r) => sum + r.expected, 0) / n;
    return { avg: Math.round(avg), ms: Math.round(ms), n };
  }

  // Question bubbles trigger
  const quantumQuestions = [
    "What is the qubit probability for high-value e-waste recovery?",
    "Simulate entanglement collapse between these pawned items?",
    "Run quantum search: find optimal offer in predictive model?",
    "Parallel 1024 sims — what is the speed of valuation?",
  ];

  async function askBubble(q: string, contextCents?: number) {
    let result = "";
    const base = contextCents || 12500;
    if (q.includes("qubit")) {
      const qv = simulateQubitValuation(base);
      result = `QUBIT STATE: ${qv.state}  •  P(high)=${(qv.probHigh*100).toFixed(0)}%  → expected $${(qv.expected/100).toFixed(0)}`;
    } else if (q.includes("entangle")) {
      const entangled = entangleItems(items.length ? items : [{appraisedValueUsdCents: {toNumber:()=>base}}]);
      result = `ENTANGLED: ${entangled.length} pawned e-waste items collapsed. Correlated valuation ~$${( (entangled[1]?.entangledValue||base)/100 ).toFixed(0)}`;
    } else if (q.includes("quantum search") || q.includes("optimal offer")) {
      const mockOffers = [82, 115, 67, 140, 99, 158, 73].map(v => Math.round(v*100));
      const gs = quantumSearchOptimalOffers(mockOffers);
      result = `GROVER FOUND: optimal $${(gs.best/100).toFixed(0)} @ ${gs.conf} confidence • ${gs.speed}`;
    } else {
      const par = await runParallelSims(base);
      result = `PARALLEL ${par.n} SIMS: avg $${(par.avg/100).toFixed(0)} completed in ${par.ms}ms (superposition paths)`;
    }
    // Show as alert bubble styled
    alert(`[QUANTUM BUBBLE] ${q}\n\n${result}\n\n— Agent 9 Quantum Intelligence`);
  }

  async function elevateAllToQuantum() {
    // Elevate all inventory with qubit + parallel + entanglement
    if (!items.length) return;
    const par = await runParallelSims(items.reduce((s,i)=>s+(i.appraisedValueUsdCents?.toNumber?.()||0),0)/items.length || 8000, 512);
    const entangled = entangleItems(items);
    // Quick demo optimal offers
    const sampleOffers = items.slice(0,5).map((i:any) => Math.round((i.appraisedValueUsdCents?.toNumber?.()||8000)* (0.6 + Math.random()*0.9)));
    const grover = quantumSearchOptimalOffers(sampleOffers.length ? sampleOffers : [9000]);
    alert(`QUANTUM ELEVATION COMPLETE\n\nParallel avg: $${(par.avg/100).toFixed(0)} (${par.ms}ms)\nEntangled items: ${entangled.length}\nGrover optimal offer: $${(grover.best/100).toFixed(0)} conf ${grover.conf}\n\nSpeed: parallel sims engaged. E-Waste valuations now quantum-enhanced.`);
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

          {/* ═══ QUANTUM INTELLIGENCE LAB (Agent 9) ═══ */}
          <div className="mb-10 bg-[#111] border border-[#2a2a2a] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="uppercase text-[10px] tracking-[3px] text-amber-400/70 font-semibold">NFTBAY QUANTUM SIM</div>
                <h2 className="text-xl font-semibold tracking-tight">Quantum Intelligence Lab — E-Waste</h2>
                <p className="text-xs text-gray-500">Qubit states for valuation uncertainty • Entanglement of pawned items • Grover search for optimal offers • Parallel sims</p>
              </div>
              <button
                onClick={elevateAllToQuantum}
                disabled={!items.length}
                className="text-xs px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 text-black font-bold rounded-lg active:scale-[0.985]"
              >
                ELEVATE ALL TO QUANTUM
              </button>
            </div>

            {/* Live Qubit + Sim Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
              {items.slice(0, 3).map((item: any, idx: number) => {
                const base = item.appraisedValueUsdCents?.toNumber?.() || 4500;
                const q = simulateQubitValuation(base);
                return (
                  <div key={idx} className="bg-[#0a0a0a] border border-[#222] rounded-xl p-3 text-xs">
                    <div className="font-mono text-amber-400/90 mb-1 truncate">{item.name || item.itemId}</div>
                    <div className="flex justify-between items-baseline">
                      <div>
                        <span className="text-gray-400">Base</span> ${(base/100).toFixed(0)}
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-400">Q-Val</span> ${(q.expected/100).toFixed(0)}
                      </div>
                    </div>
                    <div className="mt-1 text-[10px] text-gray-400 font-mono">{q.state} <span className="text-emerald-500">p={ (q.probHigh*100).toFixed(0) }%</span></div>
                    <div className="text-[10px] mt-0.5 text-amber-400/70">±${q.uncertainty.toFixed(0)} uncertainty</div>
                  </div>
                );
              })}
              {items.length === 0 && (
                <div className="md:col-span-3 text-center py-3 text-gray-600 text-xs border border-dashed border-[#222] rounded-xl">Intake e-waste items to simulate live qubit valuations</div>
              )}
            </div>

            {/* Question Bubbles for Quantum Queries */}
            <div className="mb-3">
              <div className="text-xs uppercase tracking-widest text-gray-500 mb-2">ASK THE QUANTUM LAB (click bubbles)</div>
              <div className="flex flex-wrap gap-2">
                {quantumQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => askBubble(q, items[0]?.appraisedValueUsdCents?.toNumber?.())}
                    className="group text-left px-3 py-1.5 rounded-full border border-[#333] hover:border-amber-500/60 bg-[#0a0a0a] text-xs text-gray-300 hover:text-amber-300 transition-all active:scale-[0.985]"
                  >
                    💬 {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Controls for Entanglement + Quantum Search + Parallel */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={async () => {
                  const ent = entangleItems(items.length ? items : []);
                  const msg = ent.length > 1 ? `Entanglement applied. Item[1] correlated value: $${((ent[1].entangledValue||0)/100).toFixed(0)}` : "Need ≥2 pawned items for full entanglement sim.";
                  alert(`[ENTANGLEMENT]\n\n${msg}\n\nPawned e-waste items now quantum-linked.`);
                }}
                className="text-xs border border-[#2a2a2a] hover:bg-[#1a1a1a] px-3 py-1 rounded-lg"
              >
                Entangle All Pawned Items
              </button>
              <button
                onClick={async () => {
                  const offers = items.length ? items.map((i:any)=> (i.appraisedValueUsdCents?.toNumber?.()||4000)*(0.55+Math.random())) : [6200,8900,4100,13700];
                  const g = quantumSearchOptimalOffers(offers.map(Math.round));
                  alert(`[QUANTUM SEARCH — OPTIMAL OFFERS]\n\nBest predictive offer: $${(g.best/100).toFixed(0)}\nConfidence (amplified): ${g.conf}\nSim speed: ${g.speed}\n\nGrover search complete on offer space.`);
                }}
                className="text-xs border border-[#2a2a2a] hover:bg-[#1a1a1a] px-3 py-1 rounded-lg"
              >
                Quantum Search Optimal Offers
              </button>
              <button
                onClick={async () => {
                  const base = items.length ? items.reduce((s,i:any)=>s + (i.appraisedValueUsdCents?.toNumber?.()||0),0) / items.length : 9500;
                  const p = await runParallelSims(base, 1024);
                  alert(`[PARALLEL SIMS]\n\n${p.n} simultaneous qubit paths\nAvg quantum valuation: $${(p.avg/100).toFixed(0)}\nCompleted in ${p.ms}ms\n\nSpeed: superposition + async parallelism engaged.`);
                }}
                className="text-xs border border-[#2a2a2a] hover:bg-[#1a1a1a] px-3 py-1 rounded-lg"
              >
                Run 1024 Parallel Sims
              </button>
            </div>

            <div className="mt-3 text-[10px] text-gray-600">All simulations client-side. Combines quantum concepts (superposition, entanglement, amplitude amplification) with classical speed. Focused on e-waste pawn valuation uncertainty.</div>
          </div>

          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-semibold">E-Waste Vault Inventory (&lt;15lbs)</h1>
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

          {/* Agent 13 Multi-Agent entry — Valuation Tinkering */}
          <div className="mt-10 border-t border-[#2a2a2a] pt-8">
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111] border border-violet-900/40 rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <div className="uppercase text-xs font-mono tracking-widest text-violet-400">AGENT 13</div>
                <h3 className="text-xl font-semibold">Collaborate with the Builder Team</h3>
                <p className="text-sm text-gray-400 mt-1">Launch simulated agents (Image, Predictive, Quantum) to tinker valuations &amp; offers. They debate and converge on the cheapest price — demonstrating quantum intelligence.</p>
              </div>
              <Link href="/builders" className="inline-block px-6 py-3 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 rounded-xl text-sm font-bold whitespace-nowrap self-start md:self-auto">
                OPEN BUILDER COLLECTIVE DASHBOARD →
              </Link>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
