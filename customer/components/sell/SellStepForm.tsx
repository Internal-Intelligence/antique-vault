import { CATEGORIES, CONDITIONS } from "../../lib/anchor";
import type { BubbleQuestion, PawnForm } from "../../lib/sell";

interface SellStepFormProps {
  form: PawnForm;
  bubbleQuestions: BubbleQuestion[];
  bubbleAnswers: Record<string, string>;
  autoDetectMsg: string;
  updateForm: <K extends keyof PawnForm>(key: K, val: PawnForm[K]) => void;
  answerBubble: (qKey: string, opt: string, onSelect: (v: string) => void) => void;
  runQuantumAutoDetect: () => void;
  onContinue: () => void;
}

export default function SellStepForm({
  form,
  bubbleQuestions,
  bubbleAnswers,
  autoDetectMsg,
  updateForm,
  answerBubble,
  runQuantumAutoDetect,
  onContinue,
}: SellStepFormProps) {
  return (
    <div className="ios-flow-panel p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="uppercase text-emerald-400 text-xs tracking-[2px] mb-1">QUANTUM INTELLIGENCE</div>
          <h2 className="text-xl font-semibold">Answer the Bubble Questions</h2>
        </div>
        <button
          onClick={runQuantumAutoDetect}
          className="text-xs px-4 py-1.5 rounded-full border border-[#22ffaa]/40 hover:bg-[#22ffaa]/10 active:bg-[#22ffaa]/20 text-[#22ffaa]"
        >
          📸 RUN QUANTUM AUTO-DETECT
        </button>
      </div>

      {autoDetectMsg && (
        <div className="mb-4 px-3 py-1.5 bg-[#11221a] border border-emerald-900/50 text-emerald-400 text-xs rounded-xl">
          {autoDetectMsg}
        </div>
      )}

      <div className="space-y-5">
        {bubbleQuestions.map((bq, idx) => (
          <div key={idx}>
            <div className="text-sm text-gray-400 mb-2">💬 {bq.q}</div>
            <div className="flex flex-wrap gap-2">
              {bq.options.map((opt, i) => {
                const active = bubbleAnswers[bq.key] === opt;
                return (
                  <button
                    key={i}
                    onClick={() => answerBubble(bq.key, opt, bq.onSelect)}
                    className={`bubble px-4 py-1.5 text-xs rounded-2xl border transition-all active:scale-[0.985] ${active ? "border-emerald-500 bg-emerald-500/10 text-emerald-300" : "border-white/10 hover:border-white/30 bg-[#111] text-gray-300"}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-7 pt-5 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">DEVICE NAME / MODEL</label>
          <input
            value={form.deviceName}
            onChange={(e) => updateForm("deviceName", e.target.value)}
            placeholder="iPhone 12 Pro — cracked screen"
            className="w-full ios-input text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">CATEGORY (auto-detected live)</label>
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
            CONDITION (0-5) • {CONDITIONS[form.condition]}
          </label>
          <input
            type="range"
            min={0}
            max={5}
            step={1}
            value={form.condition}
            onChange={(e) => updateForm("condition", parseInt(e.target.value))}
            className="w-full accent-emerald-400"
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
        <div className="sm:col-span-2">
          <label className="block text-xs text-gray-500 mb-1.5">DESCRIPTION (fuels predictive AI)</label>
          <textarea
            value={form.description}
            onChange={(e) => updateForm("description", e.target.value)}
            rows={2}
            placeholder="iPhone powers on but screen is shattered. Battery holds 40%. Includes cable."
            className="w-full ios-input text-sm"
          />
        </div>
      </div>

      <button
        onClick={onContinue}
        disabled={!form.deviceName.trim()}
        className="mt-6 w-full py-3.5 rounded-2xl bg-emerald-500 text-black font-bold disabled:bg-gray-800 disabled:text-gray-500 active:bg-emerald-400"
      >
        SEE QUANTUM AI VALUATION →
      </button>
      <p className="text-[10px] text-center text-gray-600 mt-2">
        All offers use predictive model. Always pennies-on-the-dollar for sustainable RWA.
      </p>
    </div>
  );
}