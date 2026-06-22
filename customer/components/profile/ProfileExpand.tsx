import { useEffect, useState } from "react";
import type { IncomeAvenue } from "./types";

interface ProfileExpandProps {
  avenues: IncomeAvenue[];
  initialExpandedId?: string | null;
  onAvenueAction: (avenue: IncomeAvenue) => void;
}

const STATUS_LABEL: Record<IncomeAvenue["status"], string> = {
  live: "Live",
  beta: "Beta",
  soon: "Soon",
};

export default function ProfileExpand({
  avenues,
  initialExpandedId = null,
  onAvenueAction,
}: ProfileExpandProps) {
  const [expanded, setExpanded] = useState<string | null>(initialExpandedId);

  useEffect(() => {
    if (initialExpandedId) setExpanded(initialExpandedId);
  }, [initialExpandedId]);

  return (
    <div className="profile-expand">
      <p className="profile-expand__intro">
        Affiliate earnings, mail-in recycling, and future storefront tools — optional programs beyond core
        buying and selling. Tap to expand.
      </p>

      <div className="profile-avenue-grid">
        {avenues.map((avenue) => {
          const isOpen = expanded === avenue.id;
          return (
            <article
              key={avenue.id}
              className={`profile-avenue ${isOpen ? "profile-avenue--open" : ""}`}
            >
              <button
                type="button"
                className="profile-avenue__head"
                onClick={() => setExpanded(isOpen ? null : avenue.id)}
                aria-expanded={isOpen}
              >
                <span className="profile-avenue__icon" aria-hidden>{avenue.icon}</span>
                <div className="min-w-0 flex-1 text-left">
                  <p className="profile-avenue__title">{avenue.title}</p>
                  <p className="profile-avenue__subtitle">{avenue.subtitle}</p>
                </div>
                <span className={`profile-avenue__status profile-avenue__status--${avenue.status}`}>
                  {STATUS_LABEL[avenue.status]}
                </span>
                <span className="profile-avenue__chevron" aria-hidden>{isOpen ? "−" : "+"}</span>
              </button>

              {isOpen && (
                <div className="profile-avenue__body">
                  <p className="profile-card__body mb-3">{avenue.summary}</p>
                  <ul className="profile-avenue__bullets">
                    {avenue.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => onAvenueAction(avenue)}
                    className={avenue.status === "live" ? "btn-primary text-sm mt-4" : "btn-secondary text-sm mt-4"}
                  >
                    {avenue.cta}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}