import { computeQuantumFeeBoostDecision } from "../quantum";
import type { PawnForm, Valuation, BoostPreview } from "./types";

const BASE_RETAIL: Record<string, number> = {
  "Smartphones": 280,
  Laptops: 420,
  Tablets: 190,
  "Headphones & Audio": 110,
  Wearables: 160,
  "Gaming Devices": 260,
  Cameras: 220,
  "Chargers & Cables": 18,
  "Small Appliances": 65,
  "Other E-Waste (<15lbs)": 45,
};

export function computeQuantumValuation(f: PawnForm): Valuation {
  const cat = f.category;
  let retail = BASE_RETAIL[cat] || 55;

  const w = parseFloat(f.weightLbs) || 3;
  if (w > 8) retail *= 0.82;
  if (w < 1.5) retail *= 1.08;

  const condFactor = 0.6 + (f.condition / 5) * 0.9;
  const workingMult = f.isWorking ? 0.095 : 0.018;

  let qFactor = 0.94 + Math.random() * 0.12;
  if ((f.description + f.deviceName).toLowerCase().match(/pro|pro max|limited|rare|new/)) {
    qFactor += 0.07;
  }

  const offer = Math.max(0.45, Math.round(retail * condFactor * workingMult * qFactor * 100) / 100);
  const confidence = 89 + Math.floor(Math.random() * 8);
  const qEntangle = 0.79 + Math.random() * 0.18;

  const factors = [
    f.isWorking ? "Working unit detected (+)" : "Non-working detected (pennies floor)",
    `${f.condition + 1}/6 condition tier`,
    `${w} lbs payload`,
    `Category baseline: ${cat}`,
    "Quantum predictive model vQ-4.2",
  ];

  try {
    const qDecision = computeQuantumFeeBoostDecision(
      offer * 100,
      920 + w * 40,
      f.isWorking ? 0.78 : 0.51,
      `pawn-${cat}-${f.isWorking}`
    );
    const xPct = qDecision.optimal.xPct;
    const adjustedOffer = Math.max(0.45, Math.round(offer * (0.82 + xPct * 2.1) * 100) / 100);
    factors.push(
      `Neural quantum: x=${(xPct * 100).toFixed(1)}% feeBps=${qDecision.optimal.feeBps} boost=${qDecision.optimal.boost} loop=${qDecision.optimal.expectedLoop}`
    );
    factors.push(
      `SNN anti-gaming: rate=${qDecision.spikeTrain.rate.toFixed(2)} score=${qDecision.spikeTrain.antiGamingScore.toFixed(2)} ${qDecision.loopholeNote.includes("FOUND") ? "GAMING BLOCKED" : "clean"}`
    );
    return {
      offerUsd: parseFloat(adjustedOffer.toFixed(2)),
      retailEst: Math.round(retail),
      confidence: Math.min(97, confidence + (qDecision.spikeTrain.antiGamingScore > 0.75 ? 4 : -1)),
      qEntangle: parseFloat(Math.min(0.98, qEntangle + (xPct - 0.05) * 0.6).toFixed(2)),
      factors,
    };
  } catch {
    return {
      offerUsd: parseFloat(offer.toFixed(2)),
      retailEst: Math.round(retail),
      confidence,
      qEntangle: parseFloat(qEntangle.toFixed(2)),
      factors,
    };
  }
}

export function computeBoostPreview(offer: number, boostX: number): BoostPreview {
  const assumedSale = Math.round(offer * (2.8 + Math.random() * 1.4));
  const houseTake = 0.82;
  const boosterShare = (boostX / 100) * assumedSale * (1 - houseTake);
  const myNet = assumedSale * (1 - houseTake - (boostX / 100) * (1 - houseTake));
  return {
    assumedSale,
    myNet: Math.max(0, Math.round(myNet * 100) / 100),
    boosterShare: Math.round(boosterShare * 100) / 100,
    platformFeeAmt: Math.round(assumedSale * houseTake * 100) / 100,
  };
}

export function getNeuroGrokRec(
  itemName: string,
  category: string,
  isWorking: boolean,
  cond: number
): number {
  const base = 5 + Math.floor(Math.random() * 6);
  let opt = base;
  if (category.includes("Smartphones") || category.includes("Laptops")) opt += 3;
  if (!isWorking) opt += 2;
  if (cond >= 4) opt -= 1;
  if (itemName.toLowerCase().match(/pro|limited|rare|new/)) opt += 1;
  opt = Math.max(3, Math.min(22, opt + (Math.random() > 0.7 ? 1 : 0)));
  return Math.floor(opt);
}

export function neurochipDecideBoost(baseVal: number, boostOn: boolean): number {
  return Math.floor((baseVal * 0.3 + (boostOn ? 15 : 5)) % 40) + 10;
}