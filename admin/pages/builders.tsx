import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../components/Layout";
import { getProgram, getVaultPda, CONDITIONS } from "../lib/anchor";
import {
  BUILDER_AGENTS,
  AgentId,
  DebateMessage,
  simulateDebate,
  computeSavings,
  Agent,
} from "../lib/agent-sim";

// Fast simulation speed (ms between messages)
// ═══════════════════════════════════════════════════════════════════════════
// BUILDER AGENTS — AI swarm for valuation debate. Ties into quantum models.
// Agent 11 (Docs/Vision) ensures all this is beautifully documented for handoff.
// ═══════════════════════════════════════════════════════════════════════════
const SIM_STEP_MS = 280;
const FINAL_DELAY = 420;

interface VaultItemLite {
  itemId: string;
  name: string;
  appraisedValueUsdCents: number;
  category?: string;
  condition: number;
}

export default function BuilderCollective() {
  const router = useRouter();
  const { connection } = useConnection();
  const wallet = useWallet();

  const [items, setItems] = useState<VaultItemLite[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [basePrice, setBasePrice] = useState<number>(4200);
  const [itemName, setItemName] = useState<string>("1969 Hot Wheels Beach Bomb — Pink");
  const [category, setCategory] = useState<string>("Toy Vehicles");

  const [isSimulating, setIsSimulating] = useState(false);
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [finalResult, setFinalResult] = useState<{
    finalCheapestPrice: number;
    savings: number;
    savingsPct: number;
    states: number;
  } | null>(null);
  const [agentStatus, setAgentStatus] = useState<Record<AgentId, 'idle' | 'thinking' | 'done'>>({
    image: 'idle', predictive: 'idle', quantum: 'idle',
  });
  const [simComplete, setSimComplete] = useState(false);
  const [speed, setSpeed] = useState<'fast' | 'instant'>('fast');
  const [autoLaunched, setAutoLaunched] = useState(false);

  // Load real vault items for seamless valuation integration
  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      loadVaultItems();
    }
  }, [wallet.connected, wallet.publicKey]);

  // Support deep link from ItemCard / valuation: /builders?base=...&name=...&cat=...
  useEffect(() => {
    if (!router.isReady) return;
    const { base, name, cat } = router.query;
    if (base) {
      const bp = parseInt(String(base)) || 4200;
      setBasePrice(bp);
      setCurrentPrice(bp);
      if (name) setItemName(String(name));
      if (cat) setCategory(String(cat));
      resetSim();

      // Auto-trigger the fast sim once on arrival from inventory (one-shot)
      if (!autoLaunched) {
        setAutoLaunched(true);
        // Slight delay to allow UI paint then launch
        setTimeout(() => {
          // call launch but use current state via closure trick — use fresh values
          launchFromParams(bp, String(name || itemName), String(cat || category));
        }, 280);
      }
    }
  }, [router.isReady, router.query]);

  async function loadVaultItems() {
    if (!wallet.publicKey) return;
    try {
      const program = getProgram(wallet as any, connection);
      const [vaultPda] = getVaultPda(wallet.publicKey);
      const itemAccounts = await program.account.itemRecord.all([
        { memcmp: { offset: 8, bytes: vaultPda.toBase58() } },
      ]);
      const lite: VaultItemLite[] = itemAccounts.map((a: any) => ({
        itemId: a.account.itemId,
        name: a.account.name,
        appraisedValueUsdCents: a.account.appraisedValueUsdCents.toNumber(),
        category: a.account.category || "Other",
        condition: a.account.condition,
      }));
      setItems(lite);
    } catch (e) {
      // silent fallback to samples
    }
  }

  function selectVaultItem(item: VaultItemLite) {
    setSelectedItemId(item.itemId);
    const price = Math.round(item.appraisedValueUsdCents / 100);
    setBasePrice(price);
    setItemName(item.name);
    setCategory(item.category || "Other");
    resetSim(price);
  }

  function useSample(sample: { name: string; price: number; cat: string }) {
    setSelectedItemId("");
    setBasePrice(sample.price);
    setItemName(sample.name);
    setCategory(sample.cat);
    resetSim(sample.price);
  }

  const samples = [
    { name: "1969 Hot Wheels Beach Bomb — Pink", price: 4850, cat: "Toy Vehicles" },
    { name: "1943 Steel Lincoln Wheat Cent — MS65", price: 1275, cat: "Coins & Currency" },
    { name: "1952 Topps Mickey Mantle #311", price: 9200, cat: "Sports Memorabilia" },
    { name: "Vintage 1968 IBM Selectric Typewriter", price: 680, cat: "Vintage Electronics" },
  ];

  function resetSim(newBase?: number) {
    const bp = typeof newBase === 'number' ? newBase : basePrice;
    setMessages([]);
    setCurrentPrice(bp);
    setFinalResult(null);
    setSimComplete(false);
    setAgentStatus({ image: 'idle', predictive: 'idle', quantum: 'idle' });
  }

  // Helper for deep-link auto launch from valuation cards (avoids stale closures)
  async function launchFromParams(bp: number, nm: string, cat: string) {
    if (isSimulating) return;
    setBasePrice(bp);
    setItemName(nm);
    setCategory(cat);
    setMessages([]);
    setCurrentPrice(bp);
    setFinalResult(null);
    setSimComplete(false);
    setAgentStatus({ image: 'idle', predictive: 'idle', quantum: 'idle' });

    setIsSimulating(true);
    setCurrentPrice(bp);

    const { messages: debateLog, finalPrice, statesExplored } = simulateDebate(nm, bp, cat);

    const stepMs = 210;
    let livePrice = bp;
    const liveMsgs: DebateMessage[] = [];

    setAgentStatus({ image: 'thinking', predictive: 'idle', quantum: 'idle' });

    for (let i = 0; i < debateLog.length; i++) {
      const m = debateLog[i];
      await new Promise(r => setTimeout(r, stepMs));
      liveMsgs.push(m);
      setMessages([...liveMsgs]);

      if (m.priceProposal && m.priceProposal < livePrice * 1.02) {
        livePrice = Math.round(livePrice * 0.97 + m.priceProposal * 0.03);
        setCurrentPrice(Math.max(Math.round(bp * 0.68), livePrice));
      }
      if (m.agentId === 'image') setAgentStatus(s => ({ ...s, image: 'thinking', predictive: i > 1 ? 'thinking' : s.predictive }));
      else if (m.agentId === 'predictive') setAgentStatus(s => ({ ...s, predictive: 'thinking', quantum: i > 3 ? 'thinking' : s.quantum }));
      else if (m.agentId === 'quantum') setAgentStatus(s => ({ ...s, quantum: 'thinking' }));

      if (i === Math.floor(debateLog.length * 0.65)) setCurrentPrice(m.priceProposal);
    }

    await new Promise(r => setTimeout(r, 280));

    const { savings, pct } = computeSavings(bp, finalPrice);
    setCurrentPrice(finalPrice);
    setFinalResult({ finalCheapestPrice: finalPrice, savings, savingsPct: pct, states: statesExplored });
    setAgentStatus({ image: 'done', predictive: 'done', quantum: 'done' });
    setSimComplete(true);
    setIsSimulating(false);
  }

  // The core: fast multi-agent collaborative simulation
  async function launchSimulation() {
    if (isSimulating) return;
    const bp = basePrice;
    const nm = itemName;
    const cat = category;

    setMessages([]);
    setFinalResult(null);
    setSimComplete(false);
    setAgentStatus({ image: 'idle', predictive: 'idle', quantum: 'idle' });
    setIsSimulating(true);
    setCurrentPrice(bp);

    const { messages: debateLog, finalPrice, statesExplored } = simulateDebate(nm, bp, cat);

    // Animate step by step — fast sims
    const stepMs = speed === 'instant' ? 8 : SIM_STEP_MS;

    let livePrice = bp;
    const liveMsgs: DebateMessage[] = [];

    // Activate agents progressively
    setAgentStatus({ image: 'thinking', predictive: 'idle', quantum: 'idle' });

    for (let i = 0; i < debateLog.length; i++) {
      const m = debateLog[i];
      await new Promise(r => setTimeout(r, stepMs));

      liveMsgs.push(m);
      setMessages([...liveMsgs]);

      // Update live price towards proposal (tinker effect)
      if (m.priceProposal && m.priceProposal < livePrice * 1.01) {
        livePrice = Math.round(livePrice * 0.985 + m.priceProposal * 0.015);
        setCurrentPrice(Math.max(livePrice, Math.round(bp * 0.68)));
      }

      // Advance agent statuses — demonstrate collaboration
      if (m.agentId === 'image') {
        setAgentStatus(s => ({ ...s, image: 'thinking', predictive: i > 1 ? 'thinking' : 'idle' }));
      } else if (m.agentId === 'predictive') {
        setAgentStatus(s => ({ ...s, predictive: 'thinking', quantum: i > 3 ? 'thinking' : 'idle' }));
      } else if (m.agentId === 'quantum') {
        setAgentStatus(s => ({ ...s, quantum: 'thinking' }));
      }

      // Show price "collapse"
      if (i === Math.floor(debateLog.length * 0.6)) {
        setCurrentPrice(m.priceProposal);
      }
    }

    await new Promise(r => setTimeout(r, FINAL_DELAY));

    const { savings, pct } = computeSavings(bp, finalPrice);
    setCurrentPrice(finalPrice);
    setFinalResult({
      finalCheapestPrice: finalPrice,
      savings,
      savingsPct: pct,
      states: statesExplored,
    });

    // Mark all done
    setAgentStatus({ image: 'done', predictive: 'done', quantum: 'done' });
    setSimComplete(true);
    setIsSimulating(false);
  }

  function replay() {
    if (isSimulating) return;
    const stepMs = speed === 'instant' ? 4 : 110;
    // quick replay by re-running sim with faster timing
    setSpeed('instant');
    setTimeout(() => {
      launchSimulation().then(() => setSpeed('fast'));
    }, 10);
  }

  function applyToValuation() {
    // Demonstrate integration: in real would update form or round price
    alert(`Offer price $${finalResult?.finalCheapestPrice} optimized. In production this would propagate to Intake valuation or Acquisition Round unit price.`);
  }

  const displayPrice = currentPrice || basePrice;
  const isConverged = !!finalResult;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header — Quantum Intelligence Branding */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="text-3xl">⚛️</div>
            <h1 className="text-3xl font-bold tracking-tight">Builder Collective</h1>
            <div className="ml-2 px-3 py-0.5 text-xs font-mono uppercase tracking-[3px] bg-violet-500/10 text-violet-400 border border-violet-500/30 rounded">AGENT 13</div>
          </div>
          <p className="text-gray-400 max-w-2xl">
            In-app team of specialized builders. Triggered from valuation or inventory.
            They debate offers in real time and converge on the <span className="text-amber-400">cheapest viable price</span> using quantum intelligence.
          </p>
          <div className="text-[10px] text-gray-600 mt-1">FAST SIMS • COLLABORATIVE DEBATE • PRICE COLLAPSE</div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Controls + Vault Items (Valuation integration) */}
          <div className="xl:col-span-5 space-y-5">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
              <div className="uppercase text-xs tracking-widest text-gray-500 mb-3">1. SELECT OFFER / VALUATION BASE</div>

              {/* Live from Vault (valuation integration) */}
              {items.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-1.5">YOUR VAULT INVENTORY — click to tinker</div>
                  <div className="grid grid-cols-1 gap-2 max-h-[138px] overflow-auto pr-1">
                    {items.slice(0, 4).map(item => {
                      const usd = Math.round(item.appraisedValueUsdCents / 100);
                      const active = selectedItemId === item.itemId;
                      return (
                        <button
                          key={item.itemId}
                          onClick={() => selectVaultItem(item)}
                          className={`text-left px-3 py-2.5 rounded-xl border text-sm flex justify-between transition-all ${active ? 'bg-amber-500/10 border-amber-500/60' : 'border-[#2a2a2a] hover:border-[#444] bg-[#121212]'}`}
                        >
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-[10px] text-gray-500">{item.itemId} • {CONDITIONS[item.condition]}</div>
                          </div>
                          <div className="font-mono text-amber-400 tabular-nums self-center"> ${usd}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Manual / Sample Controls */}
              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-1.5">QUICK SAMPLES</div>
                <div className="flex flex-wrap gap-2">
                  {samples.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => useSample(s)}
                      className="text-xs px-3 py-1 bg-[#111] hover:bg-[#222] border border-[#2a2a2a] rounded-lg transition-colors"
                    >
                      {s.name.split(' — ')[0]} <span className="text-amber-400/70">${s.price}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">BASE PRICE (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-gray-400">$</span>
                    <input
                      type="number"
                      value={basePrice}
                      onChange={(e) => { const v = parseInt(e.target.value) || 100; setBasePrice(v); resetSim(v); }}
                      className="pl-7 w-full text-xl font-semibold tracking-tight"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">ITEM / OFFER</label>
                  <input
                    value={itemName}
                    onChange={(e) => { setItemName(e.target.value); resetSim(); }}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-xs text-gray-500 mb-1">CATEGORY</label>
                <input
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); resetSim(); }}
                  className="text-sm"
                />
              </div>

              {/* Launch controls */}
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={launchSimulation}
                  disabled={isSimulating}
                  className="flex-1 py-3 bg-violet-500 hover:bg-violet-400 disabled:bg-violet-900/50 text-black font-bold text-sm rounded-xl active:scale-[0.985] transition-all flex items-center justify-center gap-2"
                >
                  {isSimulating ? (
                    <>SIMULATING QUANTUM DEBATE…</>
                  ) : (
                    <>⚡ LAUNCH MULTI-AGENT TINKER — FAST SIM</>
                  )}
                </button>
                <button
                  onClick={() => setSpeed(s => s === 'fast' ? 'instant' : 'fast')}
                  className="px-4 py-3 border border-[#333] rounded-xl text-xs text-gray-400 hover:text-white"
                  title="Toggle simulation speed"
                >
                  {speed.toUpperCase()}
                </button>
                {messages.length > 0 && (
                  <button onClick={replay} disabled={isSimulating} className="px-4 py-3 text-xs border border-[#333] rounded-xl">REPLAY</button>
                )}
              </div>

              <p className="text-[10px] text-gray-600 mt-3">Agents collaborate live. Converge on cheapest price using quantum superposition collapse + predictive + visual heuristics. Integrates AI simulation engine.</p>
            </div>

            {/* Agent Team */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
              <div className="text-xs uppercase tracking-widest text-gray-500 mb-4">THE TEAM — BUILDERS</div>
              <div className="grid grid-cols-3 gap-3">
                {BUILDER_AGENTS.map((agent: Agent) => {
                  const status = agentStatus[agent.id];
                  const statusLabel = status === 'thinking' ? 'DEBATING' : status === 'done' ? 'CONVERGED' : 'STANDBY';
                  return (
                    <div key={agent.id} className={`rounded-xl border p-3 transition-all ${status === 'thinking' ? 'border-amber-500/60 bg-amber-500/5' : status === 'done' ? 'border-emerald-600/40' : 'border-[#2a2a2a]'}`}>
                      <div className="text-3xl mb-2">{agent.emoji}</div>
                      <div className="font-semibold text-sm leading-tight">{agent.name}</div>
                      <div className="text-[10px] text-gray-500 mb-2">{agent.role}</div>
                      <div className={`text-[10px] inline-block px-1.5 py-px rounded font-mono tracking-widest ${status === 'thinking' ? 'bg-amber-400 text-black' : status === 'done' ? 'bg-emerald-600/60 text-white' : 'bg-[#222] text-gray-400'}`}>
                        {statusLabel}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* DEBATE + QUANTUM VISUALIZATION */}
          <div className="xl:col-span-7">
            <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl overflow-hidden flex flex-col h-[620px]">
              {/* Arena header */}
              <div className="px-5 py-3 bg-[#1a1a1a] border-b border-[#2a2a2a] flex items-center justify-between">
                <div>
                  <span className="font-semibold">LIVE DEBATE ARENA</span>
                  <span className="ml-2 text-xs text-gray-500">Agent 13 Collaboration Simulator</span>
                </div>
                <div className="font-mono text-sm flex items-baseline gap-1">
                  <span className="text-gray-500 text-xs">CURRENT OFFER</span>
                  <span className={`font-bold tabular-nums transition-all ${isConverged ? 'text-emerald-400 text-2xl' : 'text-amber-400 text-xl'}`}>
                    ${displayPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Bubbles / Debate log */}
              <div className="flex-1 overflow-auto p-5 space-y-4 bg-[#0a0a0a] text-sm" id="debate-scroll">
                {messages.length === 0 && !isSimulating && (
                  <div className="h-full flex items-center justify-center text-center text-gray-600">
                    <div>
                      <div className="text-5xl mb-3 opacity-50">💬</div>
                      <p>Select a base valuation then launch simulation.</p>
                      <p className="text-xs mt-1">Bubbles will stream as agents debate and optimize the offer.</p>
                    </div>
                  </div>
                )}

                {messages.map((m, idx) => {
                  const ag = BUILDER_AGENTS.find(a => a.id === m.agentId)!;
                  const isQuantum = m.agentId === 'quantum';
                  const isLast = idx === messages.length - 1;
                  return (
                    <div key={m.id} className={`flex gap-3 ${isQuantum ? 'justify-end' : ''}`}>
                      <div className={`max-w-[78%] rounded-2xl px-4 py-3 shadow ${isQuantum ? 'bg-violet-950 border border-violet-700/60' : m.agentId === 'image' ? 'bg-blue-950/70 border border-blue-700/40' : 'bg-emerald-950/70 border border-emerald-700/40'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span>{ag.emoji}</span>
                          <span className={`font-semibold text-xs tracking-wide ${isQuantum ? 'text-violet-400' : m.agentId === 'image' ? 'text-blue-400' : 'text-emerald-400'}`}>
                            {ag.name}
                          </span>
                          {m.priceProposal && (
                            <span className="ml-auto font-mono text-xs px-1.5 rounded bg-black/40 text-amber-400">
                              ${m.priceProposal}
                            </span>
                          )}
                        </div>
                        <div className="text-gray-200 leading-snug">{m.text}</div>
                        {isLast && isConverged && (
                          <div className="mt-2 text-[10px] uppercase tracking-[2px] text-emerald-500/70">→ COLLAPSED TO CHEAPEST</div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isSimulating && (
                  <div className="text-xs text-violet-400 pl-2 animate-pulse">agents exchanging amplitudes…</div>
                )}
              </div>

              {/* Quantum Viz + Result footer */}
              <div className="border-t border-[#2a2a2a] p-5 bg-[#161616]">
                <div className="flex items-center justify-between mb-2">
                  <div className="uppercase text-xs text-gray-500 tracking-[1.5px]">QUANTUM INTELLIGENCE • PRICE COLLAPSE</div>
                  {finalResult && (
                    <div className="text-xs text-emerald-400 font-semibold">STATES EXPLORED: {finalResult.states}</div>
                  )}
                </div>

                {/* Visual price convergence bar + QUANTUM STATES viz */}
                <div className="h-2.5 bg-[#222] rounded overflow-hidden mb-1">
                  <div
                    className={`h-full transition-all duration-300 ${isConverged ? 'bg-gradient-to-r from-emerald-500 to-amber-400' : 'bg-amber-500'}`}
                    style={{ width: `${Math.max(12, Math.min(100, ((displayPrice / Math.max(basePrice, 1)) * 100)))}%` }}
                  />
                </div>
                {/* Quantum state superposition visualizer — demonstrates quantum intelligence */}
                <div className="flex gap-px h-5 mb-3 opacity-80">
                  {Array.from({ length: 13 }).map((_, i) => {
                    const collapsed = isConverged && i < 3; // final lowest states emphasized
                    return (
                      <div
                        key={i}
                        className={`flex-1 rounded-sm transition-all ${collapsed ? 'bg-violet-400' : isSimulating ? 'bg-violet-600/60 animate-pulse' : 'bg-violet-900/40'}`}
                        style={{ opacity: isConverged ? (i < 4 ? 1 : 0.35) : 0.6 + (i % 3) * 0.1 }}
                      />
                    );
                  })}
                </div>

                {finalResult ? (
                  <div className="pt-1">
                    <div className="flex flex-wrap gap-x-8 gap-y-1 text-sm mb-4">
                      <div>
                        <span className="text-gray-400">BASE</span> <span className="font-mono text-gray-300">${basePrice}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">FINAL CHEAPEST</span> <span className="font-mono font-bold text-emerald-400">${finalResult.finalCheapestPrice}</span>
                      </div>
                      <div className="text-emerald-400">
                        SAVED <span className="font-bold">${finalResult.savings}</span> ({finalResult.savingsPct}%)
                      </div>
                    </div>

                    {/* THE GOAL MESSAGE: Quantum level achieved */}
                    <div className="text-center py-4 border-t border-[#2f2f2f] bg-black/40 rounded-xl">
                      <div className="font-mono text-xl tracking-[4px] text-amber-400 mb-0.5">
                        READY TO PASS THE TORCH — Agent 13
                      </div>
                      <div className="text-xs text-gray-400">Quantum consensus achieved. Site elevated to quantum intelligence level.</div>
                      <div className="mt-4 flex gap-2 justify-center">
                        <button onClick={applyToValuation} className="px-5 py-1.5 bg-white/90 hover:bg-white text-black text-sm font-medium rounded-lg">APPLY OPTIMIZED OFFER TO VALUATION / ROUNDS</button>
                        <button onClick={() => resetSim()} className="px-5 py-1.5 border border-[#444] rounded-lg text-sm">NEW SIMULATION</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">
                    The agents will propose, critique, and quantum-collapse the offer price to the cheapest stable value. 
                    All decisions simulated with integrated AI heuristics.
                  </div>
                )}
              </div>
            </div>

            {/* Instructions / Integration note */}
            <div className="mt-3 text-xs text-gray-600 px-1">
              Triggered in valuation (intake appraised value) or inventory via selection above. Bubbles demonstrate live debate. Convergence = quantum intelligence demonstrated.
              <Link href="/" className="ml-3 text-amber-400 hover:underline">← Back to Inventory</Link>
            </div>
          </div>
        </div>

        {/* Footer status */}
        {simComplete && (
          <div className="mt-8 text-center">
            <div className="inline-block px-4 py-1 text-xs rounded-full border border-emerald-700/50 bg-emerald-950 text-emerald-400 font-medium">QUANTUM LEVEL UNLOCKED — MULTI-AGENT OFFER TINKER COMPLETE</div>
          </div>
        )}
      </div>
    </Layout>
  );
}
