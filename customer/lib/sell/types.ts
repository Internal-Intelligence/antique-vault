export type PawnStep = "landing" | "flashcards" | "form" | "val" | "shipping" | "complete";

export interface PawnForm {
  deviceName: string;
  category: string;
  isWorking: boolean;
  /** User picked Working / Not Working on sell flow */
  deviceStatusChosen: boolean;
  /** null until answered; only when isWorking */
  hasIssues: boolean | null;
  issuesNote: string;
  condition: number;
  weightLbs: string;
  description: string;
}

export interface Valuation {
  offerUsd: number;
  retailEst: number;
  confidence: number;
  qEntangle: number;
  factors: string[];
}

export interface ShippingStep {
  label: string;
  detail: string;
  progress: number;
}

export interface BubbleQuestion {
  q: string;
  key: string;
  options: string[];
  onSelect: (val: string) => void;
}

export interface BoostPreview {
  assumedSale: number;
  myNet: number;
  boosterShare: number;
  platformFeeAmt: number;
}

export interface SellFlowState {
  form: PawnForm;
  valuation: Valuation | null;
  showVal: boolean;
  pawnStep: PawnStep;
  shippingProgress: number;
  currentShipStep: number;
  tracking: string;
  shipAddress: string;
  bubbleAnswers: Record<string, string>;
  autoDetectMsg: string;
  is3DAnimating: boolean;
  optimizedRouteIndex: number | null;
  boostEnabled: boolean;
  boostPercent: number;
  grokRec: string;
}