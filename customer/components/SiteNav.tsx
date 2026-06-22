import Link from "next/link";
import { useRouter } from "next/router";

export const PRIMARY_NAV = [
  { href: "/", label: "Hub", icon: "◆" },
  { href: "/auctions", label: "Auctions", icon: "⏱" },
  { href: "/market", label: "Market", icon: "✦" },
  { href: "/sell", label: "Sell", icon: "↑" },
] as const;

export const HEADER_WALLET_LINKS = [
  { href: "/acquire", label: "Fund", highlight: "fund" as const },
  { href: "/fees", label: "Fees" },
] as const;

export const SECONDARY_NAV = [
  { href: "/mission", label: "Mission" },
  { href: "/warehouse", label: "Warehouse" },
] as const;

export const ALL_SECONDARY_NAV = [...HEADER_WALLET_LINKS, ...SECONDARY_NAV] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href;
}

type NavVariant = "segmented" | "scroll" | "strip";

export function SiteNavStrip({
  className = "",
  variant = "strip",
}: {
  className?: string;
  variant?: NavVariant;
}) {
  const router = useRouter();
  const wrapClass =
    variant === "segmented"
      ? "site-nav-segmented"
      : variant === "scroll"
        ? "site-nav-scroll"
        : "site-nav-strip";

  return (
    <nav className={`${wrapClass} ${className}`.trim()} aria-label="Main">
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
              <span className="site-nav-pill__label">{item.label}</span>
            </Link>
          );
        })}
        {SECONDARY_NAV.length > 0 && variant !== "scroll" && (
          <>
            <span className="site-nav-strip__divider" aria-hidden />
            {SECONDARY_NAV.map((item) => {
              const active = isActive(router.pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`site-nav-pill site-nav-pill--secondary ${active ? "site-nav-pill--active" : ""}`}
                >
                  <span className="site-nav-pill__label">{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </div>
    </nav>
  );
}

export function SiteHeaderWalletLinks() {
  const router = useRouter();

  return (
    <nav className="ios-wallet-module__seg" aria-label="Fund and fees">
      {HEADER_WALLET_LINKS.map((item) => {
        const active = isActive(router.pathname, item.href);
        const isFund = "highlight" in item && item.highlight === "fund";
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`ios-wallet-module__link ${isFund ? "ios-wallet-module__link--fund" : ""} ${
              active ? "ios-wallet-module__link--active" : ""
            }`}
          >
            {item.label}
          </Link>
        );
      })}
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
    { href: "/profile", label: "Vault", icon: "◎" },
  ] as const;

  return (
    <nav className="site-mobile-tabs" aria-label="Mobile">
      <div className="site-mobile-tabs__chrome" aria-hidden />
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