import { ROUTE_OPTIONS } from "../../lib/sell";
import type { PawnForm, Valuation } from "../../lib/sell";
import SellWarehouseTracker from "./SellWarehouseTracker";

interface SellStepShippingProps {
  form: PawnForm;
  valuation: Valuation | null;
  shipAddress: string;
  shippingProgress: number;
  currentShipStep: number;
  tracking: string;
  is3DAnimating: boolean;
  optimizedRouteIndex: number | null;
  onShipAddressChange: (value: string) => void;
  onStartSim: () => void;
  onRunAiOptimizer: () => void;
  onSelectRoute: (idx: number) => void;
  onChainPawnStatus?: string | null;
  onChainPawnBlockers?: string[];
}

export default function SellStepShipping({
  form,
  valuation,
  shipAddress,
  shippingProgress,
  currentShipStep,
  tracking,
  is3DAnimating,
  optimizedRouteIndex,
  onShipAddressChange,
  onStartSim,
  onRunAiOptimizer,
  onSelectRoute,
  onChainPawnStatus,
  onChainPawnBlockers = [],
}: SellStepShippingProps) {
  return (
    <div id="shipping" className="sell-glass-panel sell-shipping-panel">
      <div className="sell-shipping-panel__head">
        <h2 className="sell-shipping-panel__title">Ship to warehouse</h2>
        <p className="sell-shipping-panel__sub">
          {form.deviceName || form.category} · {form.isWorking ? "Working" : "Non-working"} · $
          {valuation?.offerUsd} offer
        </p>
      </div>

      {onChainPawnStatus && (
        <div
          className={`sell-shipping-panel__status ${
            onChainPawnBlockers.length > 0
              ? "sell-shipping-panel__status--warn"
              : "sell-shipping-panel__status--ok"
          }`}
        >
          <p className="sell-shipping-panel__status-label">On-chain status</p>
          <p>{onChainPawnStatus}</p>
          {onChainPawnBlockers.length > 0 && (
            <p className="sell-shipping-panel__status-hint">
              After vault mint: connect wallet → submitAiPawnOffer → createPawnPosition
            </p>
          )}
        </div>
      )}

      <div className="sell-shipping-panel__field">
        <label className="sell-shipping-panel__label" htmlFor="sell-ship-from">
          Ship-from address
        </label>
        <input
          id="sell-ship-from"
          value={shipAddress}
          onChange={(e) => onShipAddressChange(e.target.value)}
          placeholder="123 Main St, Austin, TX 78701"
          className="sell-shipping-panel__input"
        />
      </div>

      <SellWarehouseTracker
        progress={shippingProgress}
        currentStep={currentShipStep}
        tracking={tracking}
        shipAddress={shipAddress}
        animating={is3DAnimating}
      />

      <details className="sell-shipping-routes">
        <summary className="sell-shipping-routes__summary">
          <span>Compare carrier routes</span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onRunAiOptimizer();
            }}
            className="sell-shipping-routes__compare"
          >
            Refresh
          </button>
        </summary>
        <div className="sell-shipping-routes__grid">
          {ROUTE_OPTIONS.map((r) => {
            const isActive = optimizedRouteIndex === r.i;
            return (
              <button
                key={r.i}
                type="button"
                onClick={() => onSelectRoute(r.i)}
                className={`sell-shipping-routes__card ${isActive ? "sell-shipping-routes__card--active" : ""}`}
              >
                <div className="sell-shipping-routes__carrier">
                  <span>{r.o}</span>
                  <span>{r.t}</span>
                </div>
                <div className="sell-shipping-routes__meta">
                  <span>{r.c.replace(/QUANTUM/gi, "Ground")}</span>
                  <span>{r.s}% on-time</span>
                </div>
              </button>
            );
          })}
        </div>
        <p className="sell-shipping-routes__note">Demo routes — production uses live carrier APIs.</p>
      </details>

      <button
        type="button"
        onClick={onStartSim}
        disabled={shippingProgress > 5}
        className="sell-shipping-panel__cta"
      >
        {shippingProgress > 5 ? "Tracking shipment…" : "Start shipping demo"}
      </button>
      <p className="sell-shipping-panel__footnote">
        Demo simulation. Production: courier API + on-chain status updates.
      </p>
    </div>
  );
}