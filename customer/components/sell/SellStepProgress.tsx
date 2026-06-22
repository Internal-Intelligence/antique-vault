import type { PawnStep } from "../../lib/sell";

const STEPS: { id: PawnStep | "flashcards"; label: string; match: PawnStep[] }[] = [
  { id: "flashcards", label: "Condition", match: ["flashcards"] },
  { id: "form", label: "Details", match: ["form"] },
  { id: "val", label: "Offer", match: ["val"] },
  { id: "shipping", label: "Ship", match: ["shipping"] },
  { id: "complete", label: "Mint", match: ["complete"] },
];

function stepIndex(pawnStep: PawnStep): number {
  const idx = STEPS.findIndex((s) => s.match.includes(pawnStep));
  return idx >= 0 ? idx : 0;
}

export default function SellStepProgress({ pawnStep }: { pawnStep: PawnStep }) {
  const current = stepIndex(pawnStep);
  const currentLabel = STEPS[current]?.label ?? "Sell";

  return (
    <nav className="sell-step-progress" aria-label="Sell progress">
      <div className="sell-step-progress__mobile">
        <span className="sell-step-progress__mobile-label">{currentLabel}</span>
        <span className="sell-step-progress__mobile-count">
          Step {current + 1} of {STEPS.length}
        </span>
      </div>
      <ol className="sell-step-progress__track">
        {STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li
              key={step.id}
              className={`sell-step-progress__step ${done ? "sell-step-progress__step--done" : ""} ${
                active ? "sell-step-progress__step--active" : ""
              }`}
            >
              <span className="sell-step-progress__dot" aria-hidden />
              <span className="sell-step-progress__label">{step.label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}