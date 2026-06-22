import { CATEGORIES, CONDITIONS } from "../../lib/anchor";
import type { PawnForm } from "../../lib/sell";
import SellDeviceStatus from "./SellDeviceStatus";

interface SellStepFormProps {
  form: PawnForm;
  autoDetectMsg: string;
  updateForm: <K extends keyof PawnForm>(key: K, val: PawnForm[K]) => void;
  runQuantumAutoDetect: () => void;
  onContinue: () => void;
  deviceStatusComplete: boolean;
  onDeviceStatusCompleteChange: (complete: boolean) => void;
}

export default function SellStepForm({
  form,
  autoDetectMsg,
  updateForm,
  runQuantumAutoDetect,
  onContinue,
  deviceStatusComplete,
  onDeviceStatusCompleteChange,
}: SellStepFormProps) {
  const canEvaluate = deviceStatusComplete && form.deviceName.trim().length > 0;

  return (
    <div className="ios-flow-panel p-6 mb-6">
      <SellDeviceStatus
        form={form}
        updateForm={updateForm}
        onCompleteChange={onDeviceStatusCompleteChange}
        compact
      />
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="uppercase text-emerald-400 text-xs tracking-[2px] mb-1">Almost there</div>
          <h2 className="text-xl font-semibold">Name your item</h2>
          <p className="text-sm text-zinc-500 mt-1">Flashcards done — add details for a sharper AI offer.</p>
        </div>
        <button
          type="button"
          onClick={runQuantumAutoDetect}
          className="text-xs px-4 py-1.5 rounded-full border border-[#22ffaa]/40 hover:bg-[#22ffaa]/10 active:bg-[#22ffaa]/20 text-[#22ffaa]"
        >
          Auto-detect
        </button>
      </div>

      {autoDetectMsg && (
        <div className="mb-4 px-3 py-1.5 bg-[#11221a] border border-emerald-900/50 text-emerald-400 text-xs rounded-xl">
          {autoDetectMsg}
        </div>
      )}

      <div className="space-y-4 text-sm">
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">DEVICE NAME / MODEL</label>
          <input
            value={form.deviceName}
            onChange={(e) => updateForm("deviceName", e.target.value)}
            placeholder="iPhone 12 Pro — cracked screen"
            className="w-full ios-input text-sm"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">CATEGORY</label>
            <select
              value={form.category}
              onChange={(e) => updateForm("category", e.target.value)}
              className="w-full ios-input text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              CONDITION • {CONDITIONS[form.condition]}
            </label>
            <input
              type="range"
              min={0}
              max={5}
              step={1}
              value={form.condition}
              onChange={(e) => updateForm("condition", parseInt(e.target.value))}
              className="w-full accent-emerald-400 mt-2"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">WEIGHT (lbs) &lt;15</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="14.9"
              value={form.weightLbs}
              onChange={(e) => updateForm("weightLbs", e.target.value)}
              className="w-full ios-input text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">DESCRIPTION</label>
          <textarea
            value={form.description}
            onChange={(e) => updateForm("description", e.target.value)}
            rows={2}
            placeholder="Powers on but screen cracked. Battery ~40%. Includes cable."
            className="w-full ios-input text-sm"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={!canEvaluate}
        className="mt-6 w-full py-3.5 rounded-2xl bg-emerald-500 text-black font-bold disabled:bg-gray-800 disabled:text-gray-500 active:bg-emerald-400"
      >
        Get AI valuation →
      </button>
      <p className="text-[10px] text-center text-gray-600 mt-2">
        {!deviceStatusComplete
          ? "Choose Working or Not Working above — explain any issues if needed."
          : "Offers use condition, demand, and comparable sales. You confirm before shipping."}
      </p>
    </div>
  );
}