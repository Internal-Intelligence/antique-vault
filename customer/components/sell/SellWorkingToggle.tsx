import type { PawnForm } from "../../lib/sell";

interface SellWorkingToggleProps {
  form: PawnForm;
  updateForm: <K extends keyof PawnForm>(key: K, val: PawnForm[K]) => void;
}

export default function SellWorkingToggle({ form, updateForm }: SellWorkingToggleProps) {
  return (
    <div className="mb-8 flex flex-col sm:flex-row gap-3">
      <button
        onClick={() => updateForm("isWorking", true)}
        className={`flex-1 py-3 rounded-2xl border text-sm font-semibold transition-all ${form.isWorking ? "bg-emerald-500 text-black border-emerald-400" : "bg-[#111] border-white/10 hover:border-emerald-900 text-emerald-400"}`}
      >
        ✓ WORKING FLOW — Higher Predictive Offer
      </button>
      <button
        onClick={() => updateForm("isWorking", false)}
        className={`flex-1 py-3 rounded-2xl border text-sm font-semibold transition-all ${!form.isWorking ? "bg-orange-500 text-black border-orange-400" : "bg-[#111] border-white/10 hover:border-orange-900 text-orange-400"}`}
      >
        ✗ NON-WORKING FLOW — Pennies Floor (Parts Value)
      </button>
    </div>
  );
}