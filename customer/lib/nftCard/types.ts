/** Display context for NftCard actions and layout. */
export type NftCardMode = "portfolio" | "market";

/** On-chain RWA item surfaced in portfolio and market views. */
export interface NftCardItem {
  nftMint: string;
  name: string;
  itemId: string;
  condition: number;
  /** Internal valuation; hidden in E-Waste sell flows. */
  appraisedValueUsdCents?: number;
  status?: number;
  image?: string | null;
  category?: string;
  boosted?: boolean;
  boostPercent?: number;
  boosterClaimable?: boolean;
  isPawned?: boolean;
  aiOfferValueCents?: number;
  trustChainHash?: string;
}

export interface NftCardProps {
  item: NftCardItem;
  mode?: NftCardMode;
  onStore?: () => void;
  onList?: () => void;
  onRedeem?: () => void;
  showActions?: boolean;
}

export type TrustBadgeKey = "esc" | "paper" | "ship" | "pawn" | "aiOffer";

export interface TrustBadge {
  active: boolean;
  label: string;
  title: string;
}

export type WorkingStatus = "WORKING" | "NON-WORKING";

/** Precomputed display fields derived from an NftCardItem. */
export interface NftCardDerived {
  isRedeemed: boolean;
  conditionLabel: string;
  rwaType: string;
  workingStatus: WorkingStatus;
  workingColor: string;
  showPromoted: boolean;
  trustBadges: Record<TrustBadgeKey, TrustBadge>;
}

/** Trust-chain bubble prompt shown on the card. */
export interface BubbleQuestion {
  label: string;
  tip: string;
}