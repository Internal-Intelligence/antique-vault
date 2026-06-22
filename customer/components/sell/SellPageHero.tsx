import Link from "next/link";
import { useRouter } from "next/router";
import { modeLabel } from "../../lib/sell/sellModes";
import type { SellMode } from "../../lib/sell/sellModes";
import type { PawnStep } from "../../lib/sell";

const STEP_LABELS: Partial<Record<PawnStep, string>> = {
  flashcards: "Condition",
  form: "Details",
  val: "Offer",
  shipping: "Ship",
  complete: "Complete",
};

type Props = {
  compact?: boolean;
  sellMode?: SellMode | null;
  pawnStep?: PawnStep;
};

export default function SellPageHero({ compact, sellMode, pawnStep }: Props) {
  const router = useRouter();
  const isEwasteMailin = router.query.program === "ewaste-mailin" || sellMode === "mailin";

  return (
    <div className={compact ? "sell-page-hero sell-page-hero--compact" : "sell-page-hero"}>
      <Link
        href={isEwasteMailin ? "/profile?tab=expand" : "/"}
        className="sell-page-hero__back"
      >
        ← {isEwasteMailin ? "Back to profile" : "Back to hub"}
      </Link>

      {isEwasteMailin && !compact ? (
        <>
          <p className="sell-page-hero__kicker">Mail-in program</p>
          <h1 className="page-title">Mail e-waste, get SOL</h1>
          <p className="page-subtitle max-w-lg">
            Ship electronics under 15 lbs. SOL stays in escrow until the warehouse confirms receipt.
          </p>
        </>
      ) : compact ? (
        <>
          <p className="sell-page-hero__kicker">{modeLabel(sellMode ?? null)}</p>
          <h1 className="sell-page-hero__title-compact">
            {STEP_LABELS[pawnStep ?? "landing"] ?? "Sell"}
          </h1>
        </>
      ) : (
        <>
          <p className="sell-page-hero__kicker">Vault-first selling</p>
          <h1 className="page-title">Sell on NFTBAY</h1>
          <p className="page-subtitle max-w-xl">
            Ship to the verification warehouse, get an AI offer, and mint a vault-backed NFT —
            then list, auction, or pawn on your terms.
          </p>
        </>
      )}
    </div>
  );
}