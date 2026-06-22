import type { SellMode } from "../../lib/sell/sellModes";
import { SELL_MODE_DEFS } from "../../lib/sell/sellModes";

type Props = {
  onSelect: (mode: SellMode) => void;
};

export default function SellModeChooser({ onSelect }: Props) {
  return (
    <div className="sell-mode-grid">
      {SELL_MODE_DEFS.map((mode) => (
        <button
          key={mode.id}
          type="button"
          className={`sell-mode-card sell-mode-card--${mode.tone}`}
          onClick={() => onSelect(mode.id)}
        >
          <span className="sell-mode-card__icon" aria-hidden>
            {mode.icon}
          </span>
          <span className="sell-mode-card__subtitle">{mode.subtitle}</span>
          <span className="sell-mode-card__title">{mode.title}</span>
          <span className="sell-mode-card__outcome">{mode.outcome}</span>
        </button>
      ))}
    </div>
  );
}