import Link from "next/link";
import type { ActivityItem, PrestigeBadgeDef, ProfileNextAction } from "./types";

interface ProfileOverviewProps {
  activities: ActivityItem[];
  nextAction: ProfileNextAction;
  topBadges: PrestigeBadgeDef[];
  unlockedCount: number;
  onOpenBadge: (badge: PrestigeBadgeDef) => void;
  onViewAllBadges: () => void;
}

const ACTIVITY_ICONS: Record<ActivityItem["type"], string> = {
  sale: "💵",
  list: "🏷️",
  pawn: "♟️",
  bid: "🔨",
  verify: "✓",
};

export default function ProfileOverview({
  activities,
  nextAction,
  topBadges,
  unlockedCount,
  onOpenBadge,
  onViewAllBadges,
}: ProfileOverviewProps) {
  return (
    <div className="profile-panel-grid">
      <section className="profile-card profile-card--highlight">
        <p className="profile-card__eyebrow">Recommended next step</p>
        <h2 className="profile-card__title">{nextAction.title}</h2>
        <p className="profile-card__body">{nextAction.desc}</p>
        {nextAction.onClick ? (
          <button type="button" onClick={nextAction.onClick} className="btn-primary mt-4 w-full sm:w-auto">
            {nextAction.cta}
          </button>
        ) : (
          <Link href={nextAction.href} className="btn-primary mt-4 w-full sm:w-auto">
            {nextAction.cta}
          </Link>
        )}
      </section>

      <section className="profile-card">
        <div className="profile-card__head">
          <h2 className="profile-card__title">Recent activity</h2>
          <span className="profile-live-pill">Live sync</span>
        </div>
        <ul className="profile-activity">
          {activities.map((item) => (
            <li key={item.id} className="profile-activity__item">
              <span className="profile-activity__icon" aria-hidden>
                {ACTIVITY_ICONS[item.type]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="profile-activity__title">{item.title}</p>
                <p className="profile-activity__meta">{item.meta}</p>
              </div>
              <div className="text-right shrink-0">
                {item.value && <p className="profile-activity__value">{item.value}</p>}
                <p className="profile-activity__time">{item.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="profile-card profile-card--span">
        <div className="profile-card__head">
          <div>
            <h2 className="profile-card__title">Achievements</h2>
            <p className="profile-card__sub">{unlockedCount} of 12 unlocked</p>
          </div>
          <button type="button" onClick={onViewAllBadges} className="profile-text-btn">
            View all
          </button>
        </div>
        <div className="profile-badge-row">
          {topBadges.map((badge) => (
            <button
              key={badge.id}
              type="button"
              onClick={() => onOpenBadge(badge)}
              className="profile-badge-chip"
              aria-label={`${badge.name} achievement`}
            >
              <span className="text-xl" aria-hidden>{badge.icon}</span>
              <span className="profile-badge-chip__name">{badge.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="profile-quick-links">
        <Link href="/sell" className="profile-quick-link">
          <span className="profile-quick-link__label">Sell device</span>
          <span className="profile-quick-link__arrow">→</span>
        </Link>
        <Link href="/market" className="profile-quick-link">
          <span className="profile-quick-link__label">Browse market</span>
          <span className="profile-quick-link__arrow">→</span>
        </Link>
        <Link href="/profile?tab=inventory" className="profile-quick-link">
          <span className="profile-quick-link__label">My inventory</span>
          <span className="profile-quick-link__arrow">→</span>
        </Link>
        <Link href="/fees" className="profile-quick-link">
          <span className="profile-quick-link__label">Fee schedule</span>
          <span className="profile-quick-link__arrow">→</span>
        </Link>
        <Link href="/profile?tab=expand" className="profile-quick-link">
          <span className="profile-quick-link__label">Grow income</span>
          <span className="profile-quick-link__arrow">→</span>
        </Link>
      </section>
    </div>
  );
}