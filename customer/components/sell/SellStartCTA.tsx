type Props = {
  onStart: () => void;
  compact?: boolean;
};

export default function SellStartCTA({ onStart, compact }: Props) {
  if (compact) {
    return (
      <button type="button" onClick={onStart} className="btn-primary w-full sm:w-auto">
        Sell another item
      </button>
    );
  }

  return (
    <div className="sell-start-cta mb-10">
      <div className="sell-start-cta-inner">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400/80 mb-2">
            Ready when you are
          </p>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
            Turn your item into a listing in under a minute
          </h2>
          <p className="text-sm text-zinc-500 max-w-md">
            Answer a few quick flashcards — AI handles pricing, vault custody, and marketplace placement.
          </p>
        </div>
        <button type="button" onClick={onStart} className="sell-start-btn">
          <span className="sell-start-btn-label">Sell</span>
          <span className="sell-start-btn-sub">Start flashcards →</span>
        </button>
      </div>
    </div>
  );
}