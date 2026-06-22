import type { ProfileTab } from "./types";

const TABS: { id: ProfileTab; label: string; hint: string }[] = [
  { id: "overview", label: "Overview", hint: "Status & next steps" },
  { id: "inventory", label: "Inventory", hint: "Custody & listings" },
  { id: "earn", label: "Earn", hint: "Payouts & fees" },
  { id: "expand", label: "Grow", hint: "Affiliate & programs" },
];

interface ProfileNavProps {
  active: ProfileTab;
  onChange: (tab: ProfileTab) => void;
}

export default function ProfileNav({ active, onChange }: ProfileNavProps) {
  return (
    <nav className="profile-nav" role="tablist" aria-label="Profile sections">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`profile-panel-${tab.id}`}
            id={`profile-tab-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={`profile-nav__tab ${isActive ? "profile-nav__tab--active" : ""}`}
          >
            <span className="profile-nav__label">{tab.label}</span>
            <span className="profile-nav__hint">{tab.hint}</span>
          </button>
        );
      })}
    </nav>
  );
}