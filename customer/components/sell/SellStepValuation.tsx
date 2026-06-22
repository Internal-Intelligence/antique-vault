import { useState } from "react";
import FeeDisclosure from "../FeeDisclosure";
import type { BoostPreview, PawnForm, Valuation } from "../../lib/sell";

interface SellStepValuationProps {
  form: PawnForm;
  valuation: Valuation;
  boostEnabled: boolean;
  boostPercent: number;
  grokRec: string;
  onBack: () => void;
  onAccept: () => void;
  toggleBoost: () => void;
  setBoostPercent: (pct: number) => void;
  setGrokRec: (rec: string) => void;
  applyGrokRec: () => void;
  handleNeuroDecide: (currentOffer?: number) => void;
  computeBoostPreview: (offer: number, boostX: number) => BoostPreview;
}

export default function SellStepValuation({
  form,
  valuation,
  boostEnabled,
  boostPercent,
  grokRec,
  onBack,
  onAccept,
  toggleBoost,
  setBoostPercent,
  setGrokRec,
  applyGrokRec,
  handleNeuroDecide,
  computeBoostPreview,
}: SellStepValuationProps) {
  const [showFactors, setShowFactors] = useState(false);
  const val = valuation;
  const offerPct = ((val.offerUsd / val.retailEst) * 100).toFixed(1);

  return (
    <div className="sell-glass-panel sell-valuation-panel">
      <div className="sell-valuation-panel__hero">
        <div>
          <p className="sell-valuation-panel__kicker">Your offer</p>
          <p className="sell-valuation-panel__amount">${val.offerUsd}</p>
          <p className="sell-valuation-panel__tag">Instant · locked 4 minutes</p>
        </div>
        <div className="sell-valuation-panel__compare">
          <p className="sell-valuation-panel__compare-label">vs. retail estimate</p>
          <p>
            ${val.retailEst} retail · {offerPct}% of market
          </p>
        </div>
      </div>

      <div className="sell-valuation-panel__stats">
        <div className="sell-valuation-panel__stat">
          <span className="sell-valuation-panel__stat-label">Confidence</span>
          <span className="sell-valuation-panel__stat-value">{val.confidence}%</span>
        </div>
        <div className="sell-valuation-panel__stat">
          <span className="sell-valuation-panel__stat-label">Market score</span>
          <span className="sell-valuation-panel__stat-value">{val.qEntangle}</span>
        </div>
        <div className="sell-valuation-panel__stat">
          <span className="sell-valuation-panel__stat-label">Weight / status</span>
          <span className="sell-valuation-panel__stat-value">
            {form.weightLbs} lbs · {form.isWorking ? "Working" : "Non-working"}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="sell-valuation-panel__factors-toggle"
        onClick={() => setShowFactors((v) => !v)}
        aria-expanded={showFactors}
      >
        {showFactors ? "Hide" : "Why this offer?"}
      </button>
      {showFactors && (
        <ul className="sell-valuation-panel__factors">
          {val.factors.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      )}

      <details className="sell-valuation-boost">
        <summary className="sell-valuation-boost__summary">
          <span>Promotion boost (optional)</span>
          <span className={`sell-valuation-boost__pill ${boostEnabled ? "sell-valuation-boost__pill--on" : ""}`}>
            {boostEnabled ? `${boostPercent}% active` : "Off"}
          </span>
        </summary>

        <div className="sell-valuation-boost__body">
          <p className="sell-valuation-boost__desc">
            Share a slice of resale proceeds with promoters for extra visibility on secondary sales.
          </p>

          <div className="sell-valuation-boost__actions">
            <button type="button" onClick={toggleBoost} className="sell-valuation-boost__toggle">
              {boostEnabled ? "Disable boost" : "Enable boost"}
            </button>
            <button
              type="button"
              onClick={() => handleNeuroDecide(val.offerUsd)}
              className="sell-valuation-boost__suggest"
            >
              Suggest %
            </button>
            <button type="button" onClick={applyGrokRec} className="sell-valuation-boost__suggest">
              AI suggestion
            </button>
          </div>

          {boostEnabled && (
            <>
              <div className="sell-valuation-boost__slider">
                <div className="sell-valuation-boost__slider-head">
                  <span>Promotion share</span>
                  <span>{boostPercent}%</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="25"
                  step="1"
                  value={boostPercent}
                  onChange={(e) => {
                    setBoostPercent(parseInt(e.target.value, 10));
                    setGrokRec("");
                  }}
                  className="sell-valuation-boost__range"
                />
              </div>

              {(() => {
                const p = computeBoostPreview(val.offerUsd, boostPercent);
                return (
                  <div className="sell-valuation-boost__preview">
                    <div>
                      <span>Assumed resale</span>
                      <span>${p.assumedSale}</span>
                    </div>
                    <div>
                      <span>Platform fee</span>
                      <span>-${p.platformFeeAmt}</span>
                    </div>
                    <div>
                      <span>Promoter share</span>
                      <span>-${p.boosterShare}</span>
                    </div>
                    <div className="sell-valuation-boost__net">
                      <span>Your net after boost</span>
                      <span>${p.myNet}</span>
                    </div>
                  </div>
                );
              })()}

              {grokRec && <p className="sell-valuation-boost__insight">{grokRec}</p>}
            </>
          )}
        </div>
      </details>

      <div className="sell-valuation-panel__fees">
        <FeeDisclosure promoted={boostEnabled} />
      </div>

      <div className="sell-valuation-panel__actions">
        <button type="button" onClick={onBack} className="sell-valuation-panel__back">
          Edit details
        </button>
        <button type="button" onClick={onAccept} className="sell-valuation-panel__accept">
          Accept offer &amp; ship
        </button>
      </div>
      <p className="sell-valuation-panel__footnote">
        Accepting starts shipping. Promotion applies on secondary marketplace sales only.
      </p>
    </div>
  );
}