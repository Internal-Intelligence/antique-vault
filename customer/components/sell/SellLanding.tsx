import SellModeChooser from "./SellModeChooser";
import SellTrustStrip from "./SellTrustStrip";
import SellSocialProof from "./SellSocialProof";
import type { SellMode } from "../../lib/sell/sellModes";

type Props = {
  onSelectMode: (mode: SellMode) => void;
};

export default function SellLanding({ onSelectMode }: Props) {
  return (
    <div className="sell-landing">
      <section className="sell-landing-hero sell-glass-panel">
        <p className="sell-landing-hero__kicker">NFT is the future</p>
        <h2 className="sell-landing-hero__title">Turn physical gear into vault-backed NFTs</h2>
        <p className="sell-landing-hero__sub">
          Choose how you want to sell — ship something new, list from your vault, run a timed auction,
          pawn for liquidity, or mail in e-waste. Every path ends with real custody and clear fees.
        </p>
      </section>

      <SellModeChooser onSelect={onSelectMode} />
      <SellTrustStrip />
      <SellSocialProof />
    </div>
  );
}