import { IosModal } from "../IosModal";
import type { PrestigeBadgeDef } from "./types";

interface ProfileAchievementsModalProps {
  badges: PrestigeBadgeDef[];
  isUnlocked: (id: string) => boolean;
  getProgress: (id: string) => number;
  selected: PrestigeBadgeDef | null;
  showAll: boolean;
  onClose: () => void;
  onSelect: (badge: PrestigeBadgeDef) => void;
  onShare: (badge: PrestigeBadgeDef) => void;
  onAdvance: (id: string) => void;
}

export default function ProfileAchievementsModal({
  badges,
  isUnlocked,
  getProgress,
  selected,
  showAll,
  onClose,
  onSelect,
  onShare,
  onAdvance,
}: ProfileAchievementsModalProps) {
  if (showAll && !selected) {
    return (
      <IosModal onClose={onClose}>
        <div>
          <h2 className="text-xl font-semibold tracking-tight mb-1">All achievements</h2>
          <p className="text-sm text-zinc-500 mb-5">Earn badges through selling, bidding, and vault activity.</p>
          <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-1">
            {badges.map((badge) => {
              const unlocked = isUnlocked(badge.id);
              const prog = getProgress(badge.id);
              return (
                <button
                  key={badge.id}
                  type="button"
                  onClick={() => onSelect(badge)}
                  className={`profile-achievement-tile ${unlocked ? "profile-achievement-tile--unlocked" : ""}`}
                >
                  <span className="text-2xl" aria-hidden>{badge.icon}</span>
                  <span className="text-xs font-medium mt-1">{badge.name}</span>
                  <span className="text-[10px] text-zinc-500">{badge.points} pts</span>
                  {!unlocked && prog > 0 && (
                    <span className="text-[10px] text-emerald-400 mt-0.5">{prog}%</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </IosModal>
    );
  }

  if (!selected) return null;

  const unlocked = isUnlocked(selected.id);
  const prog = getProgress(selected.id);

  return (
    <IosModal onClose={onClose}>
      <div className="text-center">
        <div className="text-5xl mb-2" aria-hidden>{selected.icon}</div>
        <h2 className="text-xl font-semibold">{selected.name}</h2>
        <p className="text-xs text-zinc-500 mb-4">{selected.points} points</p>
        <p className="text-sm text-zinc-300 leading-relaxed mb-4 text-left">{selected.detail}</p>
        <div className="ios-inset text-sm text-left mb-4">
          <p className="font-medium text-emerald-400 mb-1">How to earn</p>
          <p className="text-zinc-400">{selected.how}</p>
          {!unlocked && (
            <p className="mt-3 pt-3 border-t border-white/10 text-xs text-zinc-500">
              Progress: {prog}%
            </p>
          )}
        </div>
        {unlocked ? (
          <button type="button" onClick={() => onShare(selected)} className="btn-primary w-full">
            Share badge
          </button>
        ) : (
          <button type="button" onClick={() => onAdvance(selected.id)} className="btn-secondary w-full">
            Track progress (demo)
          </button>
        )}
        <button type="button" onClick={onClose} className="profile-text-btn mt-4 mx-auto">
          Close
        </button>
      </div>
    </IosModal>
  );
}