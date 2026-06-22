import dynamic from "next/dynamic";
import { ROUTE_OPTIONS, SHIPPING_DISPLAY_STEPS } from "../../lib/sell";
import type { PawnForm, Valuation } from "../../lib/sell";

const QuantumShippingViz = dynamic(() => import("./QuantumShippingViz"), { ssr: false });

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
    <div id="shipping" className="ios-flow-panel p-7">
      <h2 className="text-2xl font-bold mb-1">Shipping</h2>
      <p className="text-gray-400 mb-6">
        Your {form.deviceName || "item"} • {form.isWorking ? "Working" : "Non-working"} • ${valuation?.offerUsd}
      </p>

      {onChainPawnStatus && (
        <div
          className={`mb-5 p-3 rounded-xl border text-xs ${
            onChainPawnBlockers.length > 0
              ? "border-amber-500/30 bg-amber-950/20 text-amber-200"
              : "border-emerald-500/30 bg-emerald-950/20 text-emerald-200"
          }`}
        >
          <div className="font-semibold mb-1">On-chain pawn status</div>
          <p>{onChainPawnStatus}</p>
          {onChainPawnBlockers.length > 0 && (
            <p className="mt-2 text-[10px] text-amber-300/80">
              After vault mints your NFT: connect wallet → submitAiPawnOffer → createPawnPosition
            </p>
          )}
        </div>
      )}

      <div className="mb-5">
        <label className="text-xs text-gray-500 block mb-1.5">Ship-from address (demo)</label>
        <input
          value={shipAddress}
          onChange={(e) => onShipAddressChange(e.target.value)}
          placeholder="123 Main St, Austin, TX 78701"
          className="w-full bg-black border border-white/10 px-4 py-2.5 rounded-2xl text-sm"
        />
      </div>

      <div className="mb-6">
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
          <div
            className="h-1.5 bg-gradient-to-r from-purple-500 to-violet-400 transition-all"
            style={{ width: `${shippingProgress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-500">
          <div>Origin</div>
          <div>Warehouse</div>
        </div>
      </div>

      {SHIPPING_DISPLAY_STEPS.map((step, i) => (
        <div
          key={i}
          className={`mb-3 p-3 rounded-2xl border text-sm ${i <= currentShipStep ? "border-emerald-500 bg-emerald-900/10" : "border-white/5"}`}
        >
          <div className="font-semibold text-emerald-400">{step.label.replace(/QUANTUM/gi, "IN TRANSIT")}</div>
          <div className="text-gray-400 text-xs mt-0.5">
            {"detailPrefix" in step ? step.detailPrefix + (tracking || "pending") : step.detail.replace(/quantum/gi, "carrier")}
          </div>
          {i === currentShipStep && (
            <div className="text-[10px] text-emerald-400 animate-pulse mt-1">Tracking live…</div>
          )}
        </div>
      ))}

      <div className="mt-3 mb-1">
        <QuantumShippingViz
          animating={is3DAnimating}
          optimizedIndex={optimizedRouteIndex}
          shipAddress={shipAddress}
          onOptimize={onSelectRoute}
        />
      </div>

      <div className="mt-3 p-4 bg-[#050707] border border-white/10 rounded-2xl">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <div className="uppercase tracking-[2px] text-[10px] text-emerald-400">Route optimizer</div>
            <div className="text-xs text-white/70">Compare carriers and estimated delivery</div>
          </div>
          <button
            onClick={onRunAiOptimizer}
            className="text-[10px] px-3 py-1 bg-white text-black font-bold rounded hover:bg-[#22ffaa] active:bg-white"
          >
            Compare routes
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[10px]">
          {ROUTE_OPTIONS.map((r) => {
            const isActive = optimizedRouteIndex === r.i;
            return (
              <button
                key={r.i}
                onClick={() => onSelectRoute(r.i)}
                className={`text-left px-2.5 py-1.5 rounded-lg border transition-all ${isActive ? "border-[#22ffaa] bg-emerald-950/40 text-[#22ffaa]" : "border-white/10 hover:border-white/40 bg-black/50"}`}
              >
                <div className="font-mono text-[9px] flex justify-between">
                  <span>{r.o}</span> <span className="text-emerald-400/70">{r.t}</span>
                </div>
                <div className="text-[8px] text-white/50 flex justify-between">
                  <span>{r.c.replace(/QUANTUM/gi, "Ground")}</span>
                  <span className="tabular-nums">{r.s}%</span>
                </div>
                {isActive && <div className="text-[8px] text-white mt-0.5">Recommended route</div>}
              </button>
            );
          })}
        </div>
        <div className="mt-2 text-[9px] text-center text-emerald-400/60 tracking-widest">
          Demo routes only — production uses live carrier APIs
        </div>
      </div>

      <button
        onClick={onStartSim}
        disabled={shippingProgress > 5}
        className="mt-4 w-full py-3 bg-[#22ffaa] text-black font-bold rounded-2xl active:bg-white disabled:bg-gray-700"
      >
        {shippingProgress > 5 ? "Simulating shipment…" : "Start shipping demo →"}
      </button>
      <div className="text-center text-[10px] text-gray-600 mt-2">
        Demo simulation only. In production: courier API + on-chain status updates.
      </div>
    </div>
  );
}