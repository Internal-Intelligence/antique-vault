import FeeDisclosure from "../FeeDisclosure";
import { computeQuantumFeeBoostDecision, getQuantumPricingBubbles } from "../../lib/quantum";
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
  const val = valuation;

  return (
    <div className="ios-flow-panel p-7 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-emerald-400 text-xs tracking-[2px]">AI Valuation</div>
          <div className="text-5xl font-bold tabular-nums tracking-[-1.5px] text-white mt-1">${val.offerUsd}</div>
          <div className="text-emerald-400 text-sm">Instant offer</div>
        </div>
        <div className="text-right text-xs">
          <div className="text-gray-400">vs. retail estimate</div>
          <div>
            Retail est ${val.retailEst} • Offer {((val.offerUsd / val.retailEst) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5 text-center text-xs">
        <div className="bg-black/50 rounded-xl p-3">
          <div className="text-gray-500">CONFIDENCE</div>
          <div className="font-mono text-lg text-emerald-400">{val.confidence}%</div>
        </div>
        <div className="bg-black/50 rounded-xl p-3">
          <div className="text-gray-500">MARKET SCORE</div>
          <div className="font-mono text-lg text-[#22ffaa]">{val.qEntangle}</div>
        </div>
        <div className="bg-black/50 rounded-xl p-3">
          <div className="text-gray-500">WEIGHT / STATUS</div>
          <div className="font-mono text-lg">
            {form.weightLbs}lbs • {form.isWorking ? "WORKING" : "NON-WORKING"}
          </div>
        </div>
      </div>

      <div>
        <div className="uppercase text-xs tracking-widest text-gray-500 mb-2">Valuation factors</div>
        <ul className="text-sm text-gray-300 space-y-1 mb-6">
          {val.factors.map((f, i) => (
            <li key={i}>• {f}</li>
          ))}
        </ul>
      </div>

      <div className="mb-4">
        <div className="text-[10px] text-gray-500 mb-1">Pricing questions:</div>
        {["What drives this offer?", "How does condition affect price?", "Who is the likely buyer?"].map(
          (qb, k) => (
            <button
              key={k}
              onClick={() =>
                alert(
                  `${qb}\n\nBased on current market data, comparable sales, and item condition.`
                )
              }
              className="mr-1.5 mb-1 text-xs px-2 py-0.5 bg-[#0f1a16] border border-[#22ffaa]/30 hover:border-[#22ffaa] rounded text-[#22ffaa]/90"
            >
              {qb}
            </button>
          )
        )}
        {(() => {
          try {
            const qd = computeQuantumFeeBoostDecision(
              (val?.offerUsd || 12) * 100,
              880,
              form.isWorking ? 0.74 : 0.53,
              `bubble-${form.category}`
            );
            return getQuantumPricingBubbles(qd)
              .slice(0, 2)
              .map((b: { q: string; why: string; onClickSim: () => string }, k: number) => (
                <button
                  key={"q" + k}
                  onClick={() =>
                    alert(
                      `${b.q}\n\n${b.why}\n\n${b.onClickSim()}\n\nSuggested promotion: ${(qd.optimal.xPct * 100).toFixed(1)}%`
                    )
                  }
                  className="mr-1.5 mb-1 text-xs px-2 py-0.5 bg-[#112a1f] border border-violet-400/40 hover:border-violet-400 rounded text-violet-300"
                >
                  {b.q}
                </button>
              ));
          } catch {
            return null;
          }
        })()}
      </div>

      <div className="mb-5 p-4 border border-amber-500/30 bg-[#121a14] rounded-2xl">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <span className="uppercase tracking-[1.5px] text-amber-400 text-xs font-semibold">NFTBAY BOOST</span>
            <div className="text-amber-300 text-sm">Boost for x% of sold money</div>
          </div>
          <button
            onClick={toggleBoost}
            className={`text-xs px-4 py-1 rounded-full font-bold border transition-all ${boostEnabled ? "bg-amber-400 text-black border-amber-300" : "border-amber-500/40 text-amber-400 hover:bg-amber-500/10"}`}
          >
            {boostEnabled ? `BOOSTED ${boostPercent}%` : "ENABLE BOOST"}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNeuroDecide();
            }}
            className="ml-2 text-xs px-2 py-1 bg-purple-600 rounded"
          >
            Suggest promotion %
          </button>
        </div>

        {boostEnabled && (
          <div>
            <div className="mb-2.5">
              <div className="flex items-center justify-between text-[10px] text-amber-400/80 mb-1">
                <span>BOOST SHARE x%</span>
                <span className="font-mono tabular-nums">{boostPercent}%</span>
              </div>
              <input
                type="range"
                min="2"
                max="25"
                step="1"
                value={boostPercent}
                onChange={(e) => {
                  setBoostPercent(parseInt(e.target.value));
                  setGrokRec("");
                }}
                className="w-full accent-[#facc15]"
              />
            </div>

            {(() => {
              const qd = (() => {
                try {
                  return computeQuantumFeeBoostDecision(
                    (val?.offerUsd || 12) * 100,
                    1200,
                    0.8,
                    `sellboost-${form.category}`
                  );
                } catch {
                  return null;
                }
              })();
              const p = computeBoostPreview(val.offerUsd, boostPercent);
              const qx = qd ? (qd.optimal.xPct * 100).toFixed(0) : boostPercent;
              return (
                <div className="bg-black/70 rounded-xl p-2.5 mb-2.5 text-[11px] font-mono grid grid-cols-2 gap-y-[1px]">
                  <div className="text-gray-500">Assumed secondary sale</div>
                  <div className="text-right text-white">${p.assumedSale}</div>
                  <div className="text-gray-500">Platform fee</div>
                  <div className="text-right text-orange-400">-${p.platformFeeAmt}</div>
                  <div className="text-amber-400">Booster (x%) share</div>
                  <div className="text-right text-amber-400">-${p.boosterShare}</div>
                  <div className="text-emerald-400 font-bold pt-1 border-t border-white/10">YOUR NET AFTER BOOST</div>
                  <div className="text-right text-emerald-400 font-bold pt-1 border-t border-white/10">${p.myNet}</div>
                  <div className="col-span-2 text-[9px] text-amber-300/70 pt-1">
                    Suggested promotion: ~{qx}%
                  </div>
                </div>
              );
            })()}

            <div>
              <div className="text-[9px] uppercase text-amber-400/60 mb-1">AI promotion suggestions</div>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {["Optimal %?", "Max visibility?", "Best ROI?", "Compare fees?"].map((label, i) => (
                  <button
                    key={i}
                    onClick={applyGrokRec}
                    className="bubble px-2 py-px text-[9px] border border-amber-500/30 hover:border-amber-400 bg-amber-950/40 text-amber-200 rounded"
                  >
                    {label}
                  </button>
                ))}
                <button
                  onClick={applyGrokRec}
                  className="text-[9px] px-2.5 py-0.5 bg-amber-400 hover:bg-yellow-400 text-black rounded font-semibold active:scale-[0.985]"
                >
                  Get AI suggestion
                </button>
              </div>
              {grokRec && (
                <div className="text-[9px] p-1.5 bg-amber-900/30 border border-amber-500/30 rounded text-amber-100">
                  {grokRec}
                </div>
              )}
            </div>

            <div className="mt-2 text-[9px] bg-gradient-to-r from-amber-900/30 to-yellow-900/10 border border-amber-400/30 rounded-lg px-2 py-1 text-amber-300/90 flex items-center gap-2">
              <span>
                <b>How promotion works:</b> Your boost share pays promoters for visibility → more views and sales →
                higher sale price → promoter earns share → repeat
              </span>
            </div>
          </div>
        )}
        {!boostEnabled && (
          <p className="text-[9px] text-amber-400/50">
            Enable to preview fees, promoter share, and get AI suggestions for optimal promotion %
          </p>
        )}
      </div>

      <div className="mb-5">
        <FeeDisclosure promoted={boostEnabled} />
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3 border border-white/10 rounded-2xl hover:bg-white/5">
          Tweak Inputs
        </button>
        <button
          onClick={onAccept}
          className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black font-bold rounded-2xl"
        >
          Accept offer &amp; continue →
        </button>
      </div>
      <p className="text-[10px] text-center text-gray-600 mt-3">
        Offer locked for 4 minutes. Accepting starts the shipping flow. Promotion applies on secondary marketplace sales.
      </p>
    </div>
  );
}