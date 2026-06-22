import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { WalletButton } from "./WalletButton";
import HomeSearch from "./home/HomeSearch";
import { BrandAvatar } from "./BrandAvatar";
import {
  SiteNavStrip,
  SiteHeaderWalletLinks,
  PRIMARY_NAV,
  ALL_SECONDARY_NAV,
} from "./SiteNav";

export default function SiteHeader({ wide }: { wide?: boolean }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const allNav = [...PRIMARY_NAV, ...ALL_SECONDARY_NAV];
  const isHome = router.pathname === "/";

  useEffect(() => {
    setMenuOpen(false);
  }, [router.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#09090b" />
      </Head>

      <header className="site-header site-header--ios">
        <div className="site-header__chrome" aria-hidden />
        <div className={`site-header__container ${wide ? "max-w-[1280px]" : "max-w-6xl"}`}>
          <div className={`site-header__bar ${isHome ? "site-header__bar--home" : ""}`}>
            <Link href="/" className="site-brand group">
              <BrandAvatar size={36} title="NFTBAY home" className="brand-avatar--logo site-brand__mark" />
              <span className="site-brand__copy hidden sm:flex">
                <span className="site-brand__name">NFTBAY</span>
                <span className="site-brand__tag">Vault · Solana</span>
              </span>
              <span className="site-brand__beta hidden md:inline-flex">Beta</span>
            </Link>

            <div className="site-header__nav-desktop" aria-hidden={false}>
              <SiteNavStrip variant="segmented" />
            </div>

            {!isHome && (
              <div className="site-header__search">
                <HomeSearch compact glass />
              </div>
            )}

            <div className="site-header__tools">
              <Link
                href="/profile"
                className={`site-profile-chip hidden sm:inline-flex ${router.pathname === "/profile" ? "site-profile-chip--active" : ""}`}
                title="Your profile"
              >
                <BrandAvatar size={32} title="Profile" active={router.pathname === "/profile"} />
              </Link>

              <div className="ios-wallet-module">
                <WalletButton />
                <SiteHeaderWalletLinks />
              </div>

              <button
                type="button"
                className={`site-menu-btn md:hidden ${menuOpen ? "site-menu-btn--open" : ""}`}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((o) => !o)}
              >
                <span className="site-menu-btn__bars" aria-hidden>
                  <span />
                  <span />
                  <span />
                </span>
              </button>
            </div>
          </div>

          <div className="site-header__nav-mobile md:hidden">
            <SiteNavStrip variant="scroll" />
          </div>
        </div>

        {menuOpen && (
          <>
            <button
              type="button"
              className="site-header__scrim md:hidden"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            />
            <nav className="site-mobile-sheet md:hidden" aria-label="Menu">
              <div className="site-mobile-sheet__handle" aria-hidden />
              <p className="site-mobile-sheet__title">Navigate</p>
              <div className="site-mobile-sheet__group">
                {allNav.map((item) => {
                  const active =
                    item.href === "/"
                      ? router.pathname === "/"
                      : router.pathname === item.href;
                  const isFund = item.href === "/acquire";
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`site-mobile-sheet__link ${active ? "site-mobile-sheet__link--active" : ""} ${
                        isFund ? "site-mobile-sheet__link--fund" : ""
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
              <div className="site-mobile-sheet__divider" />
              <Link
                href="/profile"
                className="site-mobile-sheet__profile"
                onClick={() => setMenuOpen(false)}
              >
                <BrandAvatar size={36} title="Profile" active={router.pathname === "/profile"} />
                <span>
                  <span className="site-mobile-sheet__profile-label">Your vault</span>
                  <span className="site-mobile-sheet__profile-sub">Profile &amp; inventory</span>
                </span>
              </Link>
            </nav>
          </>
        )}
      </header>
    </>
  );
}