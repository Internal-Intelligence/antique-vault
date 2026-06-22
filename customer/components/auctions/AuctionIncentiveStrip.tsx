import { getIncentiveBotPubkey } from "../../lib/incentiveBot";

const RULES = [
  "Minimum competitive bid only — no bid wars manufactured by the platform.",
  "Eligible: tech, jewelry, cards, and high-trust vault listings.",
  "Bot never bids on its own listings or against itself.",
  "Pubkey published for on-chain verification.",
];

export default function AuctionIncentiveStrip() {
  const botPk = getIncentiveBotPubkey();

  return (
    <details className="auctions-incentive-strip glass-panel glass-panel--subtle">
      <summary className="auctions-incentive-strip__summary">
        <span className="auctions-incentive-strip__icon" aria-hidden>
          🤖
        </span>
        <span>
          <span className="auctions-incentive-strip__label">Incentive bid bot</span>
          <span className="auctions-incentive-strip__hint">
            Fee-funded liquidity on standout auctions — transparent labels on every bid
          </span>
        </span>
      </summary>
      <div className="auctions-incentive-strip__body">
        <ul className="auctions-incentive-strip__rules">
          {RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        {botPk ? (
          <p className="auctions-incentive-strip__pubkey">
            <span>Bot pubkey</span>
            <code>{botPk.toBase58()}</code>
          </p>
        ) : (
          <p className="auctions-incentive-strip__pubkey auctions-incentive-strip__pubkey--muted">
            Bot pubkey publishes when incentive wallet is live on this network.
          </p>
        )}
      </div>
    </details>
  );
}