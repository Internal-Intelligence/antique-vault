import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { IDL } from "./idl";

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN ANCHOR + CONSTANTS — Q-INTEL QUANTUM E-WASTE
// CATEGORIES power working/non-working branching.
// CONDITIONS feed AI base valuation + predictive models.
// ═══════════════════════════════════════════════════════════════════════════
export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || "FnYhRhWkpALRFhm59FSmUeEaCRLvtQCXV2PVL5Hiz3WL"
);

export function getProgram(wallet: WalletContextState, connection: Connection) {
  // AGENT 10: program cache (instant admin UI)
  const ck = 'adm';
  // @ts-ignore
  if ((globalThis as any).__admProg) return (globalThis as any).__admProg;
  const provider = new AnchorProvider(connection, wallet as any, {
    commitment: "confirmed",
  });
  const p = new Program(IDL as any, provider) as any;
  // @ts-ignore
  (globalThis as any).__admProg = p;
  return p;
}

export function getVaultPda(authority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), authority.toBuffer()],
    PROGRAM_ID
  );
}

export function getItemPda(vaultPda: PublicKey, itemId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("item"), vaultPda.toBuffer(), Buffer.from(itemId)],
    PROGRAM_ID
  );
}

export const CONDITIONS = ["Poor", "Fair", "Good", "Very Good", "Excellent", "Mint"];

// E-Waste Category & Content — hyper-realistic physical portable electronics strictly under 15lbs
export const CATEGORIES = [
  "Smartphones",
  "Laptops",
  "Tablets",
  "Headphones & Audio",
  "Wearables",
  "Gaming Devices",
  "Cameras",
  "Chargers & Cables",
  "Small Appliances",
  "Other E-Waste (<15lbs)",
];

// AI valuation engine — perfect differentiation between WORKING vs NON-WORKING (for-parts)
// All values realistic secondary-market for <15lb items. Condition modulates.
export function getAiSuggestedValue(
  category: string,
  condition: number,
  isWorking: boolean
): number {
  const workingBases: Record<string, number> = {
    "Smartphones": 275,
    "Laptops": 475,
    "Tablets & E-Readers": 185,
    "Headphones & Audio": 138,
    "Keyboards & Mice": 39,
    "Wearables": 118,
    "Handheld Gaming": 158,
    "Cameras & Photo": 195,
    "Networking Gear": 62,
    "Chargers & Cables": 16,
    "Smart Home IoT": 49,
    "Other E-Waste": 58,
  };
  const nonWorkingBases: Record<string, number> = {
    "Smartphones": 29,
    "Laptops": 44,
    "Tablets & E-Readers": 19,
    "Headphones & Audio": 13,
    "Keyboards & Mice": 5,
    "Wearables": 12,
    "Handheld Gaming": 16,
    "Cameras & Photo": 22,
    "Networking Gear": 8,
    "Chargers & Cables": 2,
    "Smart Home IoT": 7,
    "Other E-Waste": 10,
  };

  const base = (isWorking
    ? workingBases[category]
    : nonWorkingBases[category]) || (isWorking ? 58 : 10);

  // Precise condition curve: Poor heavily discounted, Mint gets premium (esp. working)
  const condMult = [0.36, 0.56, 0.76, 0.88, 0.96, 1.09][Math.max(0, Math.min(5, condition))];
  let val = Math.round(base * condMult);

  // Micro "quantum" variance for authentic market feel (small, name-seeded)
  const q = ((category.charCodeAt(0) || 65) % 5) - 2;
  val = Math.max(isWorking ? 11 : 2, val + q);

  return val;
}

// Quantum Researcher + Neurochip: Neurochip decisions for NFTBAY fee/boost plan. Grok+Solana AI selects my_fee_bps, booster, x% share for max golden loop ROI.
export function neurochipBoostDecision(priceLamports: number, sentiment = 0.7, isHighVelocity = true) {
  // Simulated neurochip (quantum + predictive): outputs ownerFeeBps ("my fee"), boosterShareBps, promote flag, booster pubkey suggestion
  const baseFee = priceLamports > 10_000_000_000 ? 250 : priceLamports > 1_000_000_000 ? 380 : 550;
  const boostPremium = isHighVelocity ? 180 : 80;
  const myFeeBps = Math.min(900, baseFee + Math.floor(sentiment * 120));
  const xShareBps = Math.floor(120 + sentiment * 80); // ~1.2-2% of sold typical for booster
  const promote = sentiment > 0.55 || isHighVelocity;
  const suggestedBooster = "GROK_TREASURY_OR_PROMOTER_PUBKEY"; // in prod: actual treasury PDA or selected
  return {
    ownerFeeBps: myFeeBps,
    boosterShareBps: xShareBps,
    isPromoted: promote,
    booster: suggestedBooster,
    neuroConfidence: (sentiment * 100).toFixed(0) + "%",
    goldenLoopMultiplier: (1 + (xShareBps / 10000) * 3 + (myFeeBps / 10000)).toFixed(2),
    note: "NEUROCHIP: my_fee + x% boost share → treasury fuels next pawn round. First Grok+Solana eBay advantage."
  };
}

// Legacy alias for compat
export function getNeuralinkQuantumDecision(priceUsd: number, context = "intake") {
  const res = neurochipBoostDecision(priceUsd * 1e9, 0.65, true); // convert rough
  return { ...res, optimalFeeBps: res.ownerFeeBps, optimalX: res.boosterShareBps / 10000 };
}

// ── Expanded Agent 7 Quantum Predictive (for dashboard & intake) ──
// Multi-outcome, image aware, user behavior, A/B, efficient

export function getQuantumOutcomes(base: number, sentiment = 0.65, sensitivity = 0.5, eco = 0.7, imgBoost = 1.0, isWorking = true) {
  const adj = (0.72 + sentiment * 0.6) * (isWorking ? 1.16 : 0.71) * imgBoost * (1 + (eco - 0.5) * 0.22);
  const branches = [
    { label: "Pessimistic", prob: 0.17, m: 0.61 },
    { label: "Cautious", prob: 0.24, m: 0.82 },
    { label: "Baseline", prob: 0.27, m: 1.0 },
    { label: "Optimistic", prob: 0.21, m: 1.19 },
    { label: "Surge", prob: 0.11, m: 1.48 },
  ];
  let ps = branches.map(b => b.prob * (1 + (sentiment - 0.5) * (b.m > 1 ? 0.55 : -0.48)));
  const sP = ps.reduce((x,y)=>x+y,0); ps = ps.map(p=>p/sP);
  const outs = branches.map((b, i) => ({
    label: b.label, prob: Math.max(0.06, Math.min(0.42, ps[i])),
    price: Math.max(4, Math.round(base * b.m * adj * (1 - sensitivity * 0.12)))
  }));
  const exp = outs.reduce((s, o) => s + o.prob * o.price, 0);
  return { outcomes: outs, expected: Math.round(exp), variance: Math.round(outs.reduce((s,o)=>s + o.prob*Math.pow(o.price-exp,2),0)) };
}

export function getCheapestEwasteModel(category: string, cond: number, working: boolean) {
  const wB: any = { "Smartphones": 265, "Laptops": 455, "Tablets & E-Readers": 175 };
  const nB: any = { "Smartphones": 27, "Laptops": 41, "Tablets & E-Readers": 17 };
  const base = (working ? (wB[category]||82) : (nB[category]||7));
  const cm = [0.38, 0.57, 0.77, 0.89, 0.97, 1.08][Math.max(0,Math.min(5,cond))];
  const w = Math.round(base * cm * (working ? 1.0 : 0.5));
  const nw = Math.round(Math.max(3, base * 0.36 * cm));
  return { working: w, nonWorking: nw };
}

export function simulateBehaviorAndAB(offerA: number, offerB: number, expected: number, sens: number, sent: number, n = 700) {
  const thresh = expected * (1.01 - sens * 0.32) * (0.9 + sent * 0.22);
  function simOne(off: number) {
    let ac = 0, rev = 0;
    for (let k = 0; k < n; k++) {
      const pb = Math.sin(k * 2.3) * 0.5 + 0.5;
      const fit = 1 - Math.min(1, Math.abs(off - thresh) / (thresh * 0.85));
      if (fit * (0.72 + pb * 0.5) > 0.61) { ac++; rev += off; }
    }
    return { conv: +(ac / n * 100).toFixed(1), rev: Math.round(rev) };
  }
  const A = simOne(offerA), B = simOne(offerB);
  return { A, B, winner: A.rev > B.rev ? "A" : "B" };
}

export function computeImageMultiplier(feats: {brightness:number, detail:number}) {
  return 0.87 + (feats.brightness - 0.5) * 0.28 + (feats.detail - 0.5) * 0.18;
}

// Image analysis stub for intake AI pipeline (Agent 7 style) — simulates fast visual feature extraction
export async function analyzeAiImage(file: File): Promise<{ brightness: number; colorVar: number; detail: number }> {
  // Fast client-side simulation: use file size + name hash for deterministic-ish features
  const buf = await file.arrayBuffer();
  const sizeSeed = (buf.byteLength % 700) / 700;
  const nameSeed = (file.name.length % 11) / 11;
  const brightness = 0.38 + sizeSeed * 0.42 + nameSeed * 0.19;
  const colorVar = 0.29 + ((file.name.charCodeAt(2) || 50) % 31) / 120 + sizeSeed * 0.2;
  const detail = 0.44 + ((file.size % 900) / 900) * 0.4 + nameSeed * 0.14;
  return {
    brightness: Math.min(0.97, Math.max(0.21, parseFloat(brightness.toFixed(2)))),
    colorVar: Math.min(0.94, Math.max(0.18, parseFloat(colorVar.toFixed(2)))),
    detail: Math.min(0.98, Math.max(0.3, parseFloat(detail.toFixed(2)))),
  };
}
