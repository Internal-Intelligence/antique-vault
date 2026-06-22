/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Agent 13 — Multi-Agent Collaboration Simulator (Quantum Intelligence Layer)
 * + Agent 11 Documentation Alignment
 *
 * Integrates AI via deterministic heuristics + fast simulation engine.
 * Simulates image analysis (Image API), predictive modeling, quantum optimization.
 * Working/non-working inputs respected.
 *
 * DOCUMENTED TO MATCH ADVANCED STATE — Agent 11
 * Fast sims: completes debate & convergence in < 4s by default.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export type AgentId = 'image' | 'predictive' | 'quantum';

export interface Agent {
  id: AgentId;
  name: string;
  emoji: string;
  role: string;
  color: string; // tailwind accent
}

export const BUILDER_AGENTS: Agent[] = [
  { id: 'image', name: 'Image Analyst', emoji: '🖼️', role: 'Visual & Rarity Assessor', color: 'blue-400' },
  { id: 'predictive', name: 'Predictive Modeler', emoji: '📈', role: 'Market Trend Forecaster', color: 'emerald-400' },
  { id: 'quantum', name: 'Quantum Optimizer', emoji: '⚛️', role: 'Superposition Price Explorer', color: 'violet-400' },
];

export interface DebateMessage {
  id: number;
  agentId: AgentId;
  text: string;
  priceProposal: number; // the price this message advocates
  timestamp: number;
}

export interface SimulationResult {
  basePrice: number;
  finalCheapestPrice: number;
  savings: number;
  savingsPct: number;
  converged: boolean;
  debateLog: DebateMessage[];
  quantumStatesExplored: number;
}

const PRICE_FLOOR_FACTOR = 0.68; // never go below this fraction of base (risk guard)

// Simple "existing AI" integration: seeded heuristic intelligence, no external calls
function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return Math.abs(h) % 100000;
}

function seededRand(seed: number, n: number): number {
  return ((seed * 16807) % 2147483647) / 2147483647 * n;
}

export function runImageAnalysis(itemName: string, category: string, basePrice: number, seedBase: number): { insight: string; proposed: number } {
  const seed = hashSeed(itemName + category) + seedBase;
  const rarityBoost = (seededRand(seed, 0.18) + 0.04); // 4-22%
  const visualAdj = basePrice * (1 + rarityBoost);
  const proposed = Math.round(visualAdj);
  const insight = `Visual scan: high-detail ${category.toLowerCase()} features detected. Rare variant probability ${Math.floor(rarityBoost*100)}%. Image data lifts value by +$${Math.round(basePrice*rarityBoost)}.`;
  return { insight, proposed };
}

export function runPredictiveForecast(itemName: string, basePrice: number, seedBase: number): { insight: string; proposed: number } {
  const seed = hashSeed(itemName) + seedBase + 777;
  // Predictive model: historical comps + trend (slightly conservative)
  const trend = 0.92 + seededRand(seed, 0.11); // 0.92–1.03x
  const proposed = Math.round(basePrice * trend);
  const delta = proposed - basePrice;
  const sign = delta >= 0 ? '+' : '';
  const insight = `ML forecast: 142 similar lots show median multiplier ${trend.toFixed(2)}x. Demand curve predicts ${sign}$${Math.abs(delta)}. Recommend anchoring near market equilibrium.`;
  return { insight, proposed };
}

export function runQuantumOptimization(itemName: string, basePrice: number, seedBase: number): { insight: string; proposed: number; states: number } {
  const seed = hashSeed('quantum' + itemName) + seedBase * 3;
  const states = 13 + Math.floor(seededRand(seed, 7)); // "quantum" 13-19 states
  const samples: number[] = [];
  for (let i = 0; i < states; i++) {
    // superposition: sample around base with bias to lower (cheapest viable)
    const bias = 0.71 + seededRand(seed + i * 31, 0.32);
    samples.push(Math.round(basePrice * bias));
  }
  // Collapse wavefunction to cheapest stable state (quantum intelligence)
  const cheapest = Math.min(...samples);
  const floor = Math.round(basePrice * PRICE_FLOOR_FACTOR);
  const proposed = Math.max(cheapest, floor);
  const insight = `Quantum collapse: ${states} entangled price states measured. Lowest viable amplitude at $${proposed}. Entanglement with liquidity & condition satisfied.`;
  return { insight, proposed, states };
}

// Orchestrates the full debate sequence. Fast: returns full log after conceptual steps.
export function simulateDebate(
  itemName: string,
  basePrice: number,
  category = 'Antique'
): { messages: DebateMessage[]; finalPrice: number; statesExplored: number } {
  const seed = hashSeed(itemName + Date.now().toString().slice(-4)); // stable enough per run but fresh
  const messages: DebateMessage[] = [];
  let msgId = 1;
  let currentBest = basePrice;

  // Phase 1: Initial scans
  const img = runImageAnalysis(itemName, category, basePrice, seed);
  messages.push({
    id: msgId++,
    agentId: 'image',
    text: img.insight,
    priceProposal: img.proposed,
    timestamp: 0,
  });
  currentBest = Math.min(currentBest, img.proposed);

  const pred = runPredictiveForecast(itemName, basePrice, seed);
  messages.push({
    id: msgId++,
    agentId: 'predictive',
    text: pred.insight,
    priceProposal: pred.proposed,
    timestamp: 120,
  });
  currentBest = Math.min(currentBest, pred.proposed);

  const quant = runQuantumOptimization(itemName, basePrice, seed);
  messages.push({
    id: msgId++,
    agentId: 'quantum',
    text: quant.insight,
    priceProposal: quant.proposed,
    timestamp: 240,
  });
  currentBest = Math.min(currentBest, quant.proposed);

  // Debate round 2: cross-agent critique & refinement (fast convergence)
  // Image challenges predictive
  const img2 = Math.round((img.proposed + currentBest) / 2 + seededRand(seed + 11, basePrice * 0.03));
  messages.push({
    id: msgId++,
    agentId: 'image',
    text: `Debate: Predictive median ignores visual rarity. I stand by $${img.proposed}. But listening to quantum amplitudes — can we settle lower without risk?`,
    priceProposal: img2,
    timestamp: 360,
  });
  currentBest = Math.min(currentBest, img2);

  // Predictive responds
  const pred2 = Math.round((pred.proposed + currentBest) * 0.96);
  messages.push({
    id: msgId++,
    agentId: 'predictive',
    text: `Counter: Historical variance high. Lowering to $${pred2} balances sell-through probability. Quantum floor respected.`,
    priceProposal: pred2,
    timestamp: 480,
  });
  currentBest = Math.min(currentBest, pred2);

  // Quantum forces convergence to cheapest
  const q2 = Math.round(Math.max(quant.proposed * 0.985, basePrice * PRICE_FLOOR_FACTOR));
  messages.push({
    id: msgId++,
    agentId: 'quantum',
    text: `Entanglement complete. Superposition narrowed to single cheapest coherent price: $${q2}. All agents aligned. Collapse now.`,
    priceProposal: q2,
    timestamp: 600,
  });
  currentBest = Math.min(currentBest, q2);

  // Final agreement round
  const consensus = Math.round(Math.min(img2, pred2, q2, basePrice * 0.91));
  const floor = Math.round(basePrice * PRICE_FLOOR_FACTOR);
  const finalCheapest = Math.max(consensus, floor);

  messages.push({
    id: msgId++,
    agentId: 'quantum',
    text: `Consensus locked. Quantum intelligence: cheapest viable offer = $${finalCheapest} (${((1 - finalCheapest / basePrice) * 100).toFixed(1)}% optimized). Ready for execution.`,
    priceProposal: finalCheapest,
    timestamp: 720,
  });

  return {
    messages,
    finalPrice: finalCheapest,
    statesExplored: quant.states,
  };
}

export function computeSavings(base: number, final: number) {
  const savings = Math.max(0, Math.round(base - final));
  const pct = base > 0 ? Math.round((savings / base) * 100) : 0;
  return { savings, pct };
}

// ═══════════════════════════════════════════════════════════════════════════
// NEURALINK SPIKING + QUANTUM ANTI-GAMING (Quantum Researcher addition)
// Added to AI sims per NFTBAY task: simulate spike-trains for anti-gaming decisions
// Feeds fee/boost quantum intelligence. Collaborates with business shark/loophole logic.
// ═══════════════════════════════════════════════════════════════════════════
export interface SpikeTrainResult {
  spikes: number[];
  rate: number;
  burstiness: number;
  antiGamingScore: number;
  gamingDetected: boolean;
}

export function simulateSpikeTrainForAntiGaming(context: string, timesteps = 32): SpikeTrainResult {
  // Lightweight port of quantum.ts SNN for admin sims (deterministic)
  const spikes: number[] = [];
  let voltage = 0.2;
  let count = 0;
  const seedBase = context.split('').reduce((a, c) => a + c.charCodeAt(0), 17) % 99991;

  for (let t = 0; t < timesteps; t++) {
    const input = ((seedBase * (t + 3)) % 97) / 97;
    voltage = voltage * 0.79 + input * 0.29;
    let sp = 0;
    if (voltage > 0.94) {
      sp = 1;
      voltage = 0.1;
      count++;
    } else if (input > 0.81) {
      sp = 1;
      count++;
    }
    spikes.push(sp);
  }

  const rate = count / timesteps;
  let varSum = 0;
  for (let i = 0; i < spikes.length; i++) varSum += Math.pow(spikes[i] - rate, 2);
  const burstiness = Math.sqrt(varSum / timesteps);
  const anti = Math.max(0.08, Math.min(0.99, 1 - (burstiness * 2.4 + (rate > 0.41 ? 0.25 : 0))));
  return {
    spikes,
    rate: Math.round(rate * 1000) / 1000,
    burstiness: Math.round(burstiness * 1000) / 1000,
    antiGamingScore: Math.round(anti * 1000) / 1000,
    gamingDetected: anti < 0.55
  };
}

// Neural layer stub for fee/boost sims inside agent debate
export function neuralDecisionLayer(features: number[]): number {
  // Tiny BCI-style perceptron
  const w = [1.15, -0.6, 0.85, 0.4];
  let s = 0.11;
  for (let i = 0; i < features.length; i++) s += features[i] * (w[i % w.length] || 0.3);
  return 1 / (1 + Math.exp(-s * 0.9));
}
