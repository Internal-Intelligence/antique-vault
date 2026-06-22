import { SHIPPING_SIM_STEPS } from "../../lib/sell";

type Props = {
  progress: number;
  currentStep: number;
  tracking: string;
  shipAddress: string;
  animating: boolean;
};

export default function SellWarehouseTracker({
  progress,
  currentStep,
  tracking,
  shipAddress,
  animating,
}: Props) {
  const steps = [
    { label: "Label created", detail: tracking ? `Tracking ${tracking}` : "Preparing label" },
    ...SHIPPING_SIM_STEPS.map((s) => ({ label: s.label, detail: s.detail })),
  ];

  return (
    <div className="sell-warehouse-tracker">
      <div className="sell-warehouse-map" aria-hidden>
        <svg viewBox="0 0 320 80" className="sell-warehouse-map__svg">
          <defs>
            <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(52,211,153,0.15)" />
              <stop offset="100%" stopColor="rgba(52,211,153,0.55)" />
            </linearGradient>
          </defs>
          <path
            d="M 24 52 Q 120 20 200 44 T 296 28"
            fill="none"
            stroke="url(#routeGrad)"
            strokeWidth="2"
            strokeDasharray={animating ? "6 4" : "none"}
          />
          <circle cx="24" cy="52" r="5" fill="rgba(161,161,170,0.8)" />
          <circle cx="296" cy="28" r="7" fill="rgba(52,211,153,0.9)" />
          <text x="24" y="68" fill="rgba(161,161,170,0.7)" fontSize="9" fontFamily="system-ui">
            You
          </text>
          <text x="268" y="22" fill="rgba(52,211,153,0.9)" fontSize="9" fontFamily="system-ui">
            Austin hub
          </text>
        </svg>
        {shipAddress && (
          <p className="sell-warehouse-map__from">
            From: <span>{shipAddress}</span>
          </p>
        )}
      </div>

      <div className="sell-warehouse-tracker__bar">
        <div className="sell-warehouse-tracker__fill" style={{ width: `${Math.max(4, progress)}%` }} />
      </div>

      <ol className="sell-warehouse-timeline">
        {steps.map((step, i) => {
          const done = i < currentStep || progress >= 100;
          const active = i === currentStep + 1 || (i === 0 && currentStep === 0 && progress > 0);
          return (
            <li
              key={`${step.label}-${i}`}
              className={`sell-warehouse-timeline__item ${done ? "sell-warehouse-timeline__item--done" : ""} ${
                active ? "sell-warehouse-timeline__item--active" : ""
              }`}
            >
              <span className="sell-warehouse-timeline__marker" aria-hidden />
              <div>
                <p className="sell-warehouse-timeline__label">{step.label}</p>
                <p className="sell-warehouse-timeline__detail">{step.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}