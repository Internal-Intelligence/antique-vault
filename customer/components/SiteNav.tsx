import Link from "next/link";
import { useRouter } from "next/router";

export const PRIMARY_NAV = [
  { href: "/", label: "Hub", icon: "◆" },
  { href: "/auctions", label: "Auctions", icon: "⏱" },
  { href: "/market", label: "Market", icon: "✦" },
  { href: "/sell", label: "Sell", icon: "↑" },
] as const;

export const SECONDARY_NAV = [
  { href: "/acquire", label: "Fund" },
  { href: "/fees", label: "Fees" },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href;
}

export function SiteNavStrip({ className = "" }: { className?: string }) {
  const router = useRouter();

  return (
    <nav className={`site-nav-strip ${className}`.trim()} aria-label="Main">
      <div className="site-nav-strip__inner">
        {PRIMARY_NAV.map((item) => {
          const active = isActive(router.pathname, item.href);
          const isHub = item.href === "/";
          const isAuctions = item.href === "/auctions";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`site-nav-pill ${isHub ? "site-nav-pill--hub" : ""} ${
                isAuctions ? "site-nav-pill--auctions" : ""
              } ${active ? "site-nav-pill--active" : ""}`}
            >
              <span className="site-nav-pill__icon" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
        <span className="site-nav-strip__divider" aria-hidden />
        {SECONDARY_NAV.map((item) => {
          const active = isActive(router.pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`site-nav-pill site-nav-pill--secondary ${active ? "site-nav-pill--active" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function SiteMobileTabBar() {
  const router = useRouter();

  const tabs = [
    { href: "/", label: "Hub", icon: "◆" },
    { href: "/auctions", label: "Auctions", icon: "⏱" },
    { href: "/market", label: "Market", icon: "✦" },
    { href: "/sell", label: "Sell", icon: "↑" },
    { href: "/profile", label: "Profile", icon: "◎" },
  ] as const;

  return (
    <nav className="site-mobile-tabs md:hidden" aria-label="Mobile">
      {tabs.map((tab) => {
        const active = isActive(router.pathname, tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`site-mobile-tab ${active ? "site-mobile-tab--active" : ""}`}
          >
            <span className="site-mobile-tab__icon" aria-hidden>
              {tab.icon}
            </span>
            <span className="site-mobile-tab__label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}