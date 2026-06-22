export default function AppLoadingSplash() {
  return (
    <div className="app-loading-splash" role="status" aria-live="polite" aria-label="Loading NFTBAY">
      <div className="app-loading-splash__ambient" aria-hidden>
        <span className="app-loading-orb app-loading-orb--emerald" />
        <span className="app-loading-orb app-loading-orb--violet" />
      </div>
      <div className="app-loading-splash__card glass-panel">
        <div className="app-loading-logo" aria-hidden>
          <span className="app-loading-logo-mark">NFT</span>
          <span className="app-loading-logo-accent">BAY</span>
        </div>
        <div className="app-loading-bar" aria-hidden>
          <div className="app-loading-bar-fill" />
        </div>
        <p className="app-loading-text">Warming up the vault…</p>
      </div>
    </div>
  );
}