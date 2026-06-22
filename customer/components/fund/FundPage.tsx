import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { motion } from "framer-motion";
import { requireIdVerification } from "../../lib/anchor";
import {
  fetchOpenRounds,
  buyRoundUnits,
  lamportsToSol,
  roundProgress,
  FUND_STATS,
  FUND_STEPS,
  FUND_PERKS,
  FUND_FAQ,
  UNIT_BUNDLES,
  UPCOMING_ROUNDS,
  type AcquisitionRoundAccount,
} from "../../lib/acquire";

type Tab = "live" | "upcoming";

export default function FundPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { setVisible: setWalletModal } = useWalletModal();
  const [tab, setTab] = useState<Tab>("live");
  const [rounds, setRounds] = useState<AcquisitionRoundAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [unitCounts, setUnitCounts] = useState<Record<number, string>>({});
  const [bundles, setBundles] = useState<Record<number, string>>({});
  const [buyingId, setBuyingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [toast, setToast] = useState("");

  const loadRounds = useCallback(async () => {
    setLoading(true);
    try {
      const open = await fetchOpenRounds(connection);
      setRounds(open);
      if (open.length === 0) setTab("upcoming");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    loadRounds();
  }, [loadRounds]);

  const totals = useMemo(() => {
    const raised = rounds.reduce((s, r) => s + lamportsToSol(r.raisedLamports), 0);
    const units = rounds.reduce((s, r) => s + r.unitsSold.toNumber(), 0);
    return { raised, units, count: rounds.length };
  }, [rounds]);

  function getUnitCount(roundId: number): number {
    return Math.max(1, parseInt(unitCounts[roundId] || "1", 10) || 1);
  }

  function applyBundle(roundId: number, bundleId: string) {
    const b = UNIT_BUNDLES.find((x) => x.id === bundleId);
    if (!b) return;
    setBundles((p) => ({ ...p, [roundId]: bundleId }));
    setUnitCounts((p) => ({ ...p, [roundId]: String(b.units) }));
  }

  async function handleBuy(round: AcquisitionRoundAccount) {
    if (!wallet.connected || !wallet.publicKey) {
      setWalletModal(true);
      return;
    }
    const count = getUnitCount(round.roundId);
    setErrors((p) => ({ ...p, [round.roundId]: "" }));
    setBuyingId(round.roundId);
    try {
      requireIdVerification(`fund-round-${round.roundId}`, "buy-acq");
      const sig = await buyRoundUnits(wallet, connection, round, count);
      setToast(`Units purchased · ${sig.slice(0, 8)}…`);
      setTimeout(() => setToast(""), 4000);
      await loadRounds();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      setErrors((p) => ({ ...p, [round.roundId]: msg }));
    } finally {
      setBuyingId(null);
    }
  }

  return (
    <div className="fund-page">
      {toast && (
        <div className="fund-toast" role="status">
          {toast}
        </div>
      )}

      {/* Hero */}
      <section className="fund-hero glass-panel">
        <div className="fund-hero__ambient" aria-hidden />
        <div className="fund-hero__content">
          <p className="fund-hero__kicker">Inventory flywheel</p>
          <h1 className="fund-hero__title">
            Fund the vault.
            <br />
            <span className="fund-hero__accent">Get first pick.</span>
          </h1>
          <p className="fund-hero__sub">
            Acquisition rounds let you fuel real inventory before it hits the market. Buy UNIT tokens with SOL,
            vault sources the gear, and you get priority when those items mint as NFTs.
          </p>
          <div className="fund-hero__actions">
            {wallet.connected ? (
              <button
                type="button"
                className="glass-cta glass-cta--primary"
                onClick={() => document.getElementById("fund-rounds")?.scrollIntoView({ behavior: "smooth" })}
              >
                {rounds.length > 0 ? "View live rounds" : "See upcoming rounds"}
              </button>
            ) : (
              <button type="button" className="glass-cta glass-cta--primary" onClick={() => setWalletModal(true)}>
                Connect to fund
              </button>
            )}
            <Link href="/market" className="glass-cta glass-cta--ghost">
              Browse market instead →
            </Link>
          </div>
        </div>
        <div className="fund-hero__stats">
          {FUND_STATS.map((s) => (
            <div key={s.label} className="fund-stat-chip glass-panel glass-panel--subtle">
              <span className="fund-stat-chip__value">{s.value}</span>
              <span className="fund-stat-chip__label">{s.label}</span>
              <span className="fund-stat-chip__detail">{s.detail}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Live totals */}
      {totals.count > 0 && (
        <section className="fund-totals glass-panel glass-panel--subtle">
          <div>
            <span className="fund-totals__label">Live on devnet</span>
            <span className="fund-totals__value">{totals.raised.toFixed(2)} SOL raised</span>
          </div>
          <div>
            <span className="fund-totals__label">Community</span>
            <span className="fund-totals__value">{totals.units.toLocaleString()} units sold</span>
          </div>
          <div>
            <span className="fund-totals__label">Open now</span>
            <span className="fund-totals__value">{totals.count} round{totals.count === 1 ? "" : "s"}</span>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="fund-section">
        <h2 className="fund-section__title">How funding works</h2>
        <p className="fund-section__sub">Four steps from SOL deposit to priority access on fresh inventory.</p>
        <div className="fund-steps">
          {FUND_STEPS.map((step, i) => (
            <motion.div
              key={step.step}
              className="fund-step glass-panel glass-panel--subtle"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <span className="fund-step__icon">{step.icon}</span>
              <span className="fund-step__num">{step.step}</span>
              <h3 className="fund-step__title">{step.title}</h3>
              <p className="fund-step__desc">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Perks */}
      <section className="fund-section">
        <h2 className="fund-section__title">Why fund a round?</h2>
        <div className="fund-perks">
          {FUND_PERKS.map((perk) => (
            <div key={perk.title} className="fund-perk glass-panel glass-panel--subtle">
              <span className="fund-perk__icon">{perk.icon}</span>
              <h3 className="fund-perk__title">{perk.title}</h3>
              <p className="fund-perk__desc">{perk.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Rounds */}
      <section id="fund-rounds" className="fund-section">
        <div className="fund-section__head">
          <div>
            <h2 className="fund-section__title">Acquisition rounds</h2>
            <p className="fund-section__sub">
              {rounds.length > 0
                ? "Live rounds accept SOL now. Units mint to your wallet on purchase."
                : "No live rounds on-chain yet — preview what's coming and get ready."}
            </p>
          </div>
          <div className="fund-tabs">
            <button
              type="button"
              className={`fund-tab ${tab === "live" ? "fund-tab--active" : ""}`}
              onClick={() => setTab("live")}
            >
              Live {rounds.length > 0 && `(${rounds.length})`}
            </button>
            <button
              type="button"
              className={`fund-tab ${tab === "upcoming" ? "fund-tab--active" : ""}`}
              onClick={() => setTab("upcoming")}
            >
              Upcoming
            </button>
          </div>
        </div>

        {tab === "live" && (
          <>
            {loading ? (
              <div className="fund-loading">
                <div className="fund-loading__spinner" />
                <p>Scanning on-chain rounds…</p>
              </div>
            ) : rounds.length === 0 ? (
              <div className="fund-empty glass-panel glass-panel--subtle">
                <p className="fund-empty__title">No live rounds yet</p>
                <p className="fund-empty__sub">
                  Vault ops open rounds on devnet as inventory plans lock in. Check upcoming drops or list gear to
                  help fuel the loop from the sell side.
                </p>
                <div className="fund-empty__actions">
                  <button type="button" className="glass-cta glass-cta--primary" onClick={() => setTab("upcoming")}>
                    View upcoming rounds
                  </button>
                  <Link href="/sell" className="glass-cta glass-cta--ghost">
                    Sell inventory →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="fund-rounds">
                {rounds.map((round, i) => (
                  <FundRoundCard
                    key={`${round.authority.toBase58()}-${round.roundId}`}
                    round={round}
                    index={i}
                    unitCount={getUnitCount(round.roundId)}
                    unitCountRaw={unitCounts[round.roundId] || "1"}
                    selectedBundle={bundles[round.roundId]}
                    error={errors[round.roundId]}
                    buying={buyingId === round.roundId}
                    connected={wallet.connected}
                    onUnitChange={(v) => setUnitCounts((p) => ({ ...p, [round.roundId]: v }))}
                    onBundle={(id) => applyBundle(round.roundId, id)}
                    onBuy={() => handleBuy(round)}
                    onConnect={() => setWalletModal(true)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "upcoming" && (
          <div className="fund-upcoming">
            {UPCOMING_ROUNDS.map((u, i) => (
              <motion.div
                key={u.id}
                className="fund-upcoming-card glass-panel glass-panel--subtle"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="fund-upcoming-card__icon">{u.icon}</div>
                <div className="fund-upcoming-card__body">
                  <span className="fund-upcoming-card__cat">{u.category}</span>
                  <h3 className="fund-upcoming-card__title">{u.title}</h3>
                  <p className="fund-upcoming-card__tag">{u.tagline}</p>
                  <div className="fund-upcoming-card__meta">
                    <span>Target ~{u.targetSol} SOL</span>
                    <span>~{u.unitPriceSol} SOL / unit</span>
                    <span className="fund-upcoming-card__eta">{u.eta}</span>
                  </div>
                </div>
                <span className="fund-upcoming-card__badge">Preview</span>
              </motion.div>
            ))}
            <p className="fund-upcoming-note">
              Upcoming rounds are planning previews — not yet on-chain. Connect your wallet on the Live tab when a
              round opens.
            </p>
          </div>
        )}
      </section>

      {/* Golden loop */}
      <section className="fund-loop glass-panel">
        <div className="fund-loop__copy">
          <p className="fund-loop__kicker">The golden loop</p>
          <h2 className="fund-loop__title">Fees fuel inventory. Inventory fuels deals.</h2>
          <p className="fund-loop__sub">
            Every marketplace sale, boost, and pawn fee recycles into vault sourcing. Fund rounds sit at the start of
            that loop — you are upstream of the listings everyone else fights over.
          </p>
          <Link href="/fees" className="fund-loop__link">
            See fee breakdown →
          </Link>
        </div>
        <div className="fund-loop__viz" aria-hidden>
          <span className="fund-loop__node">Fund</span>
          <span className="fund-loop__arrow">→</span>
          <span className="fund-loop__node">Source</span>
          <span className="fund-loop__arrow">→</span>
          <span className="fund-loop__node">Vault</span>
          <span className="fund-loop__arrow">→</span>
          <span className="fund-loop__node">Market</span>
          <span className="fund-loop__arrow">→</span>
          <span className="fund-loop__node fund-loop__node--accent">Fees</span>
        </div>
      </section>

      {/* FAQ */}
      <section className="fund-section">
        <h2 className="fund-section__title">Questions</h2>
        <div className="fund-faq">
          {FUND_FAQ.map((item, i) => (
            <div key={item.q} className="fund-faq-item glass-panel glass-panel--subtle">
              <button
                type="button"
                className="fund-faq-item__q"
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                aria-expanded={faqOpen === i}
              >
                {item.q}
                <span className="fund-faq-item__chev">{faqOpen === i ? "−" : "+"}</span>
              </button>
              {faqOpen === i && <p className="fund-faq-item__a">{item.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="fund-cta-band glass-panel">
        <div>
          <h2 className="fund-cta-band__title">Not ready to fund?</h2>
          <p className="fund-cta-band__sub">
            Sell gear, bid on auctions, or browse vault-backed deals — every path feeds the same marketplace.
          </p>
        </div>
        <div className="fund-cta-band__actions">
          <Link href="/sell" className="glass-cta glass-cta--primary">
            Sell an item
          </Link>
          <Link href="/auctions" className="glass-cta glass-cta--ghost">
            Live auctions
          </Link>
        </div>
      </section>
    </div>
  );
}

function FundRoundCard({
  round,
  index,
  unitCount,
  unitCountRaw,
  selectedBundle,
  error,
  buying,
  connected,
  onUnitChange,
  onBundle,
  onBuy,
  onConnect,
}: {
  round: AcquisitionRoundAccount;
  index: number;
  unitCount: number;
  unitCountRaw: string;
  selectedBundle?: string;
  error?: string;
  buying: boolean;
  connected: boolean;
  onUnitChange: (v: string) => void;
  onBundle: (id: string) => void;
  onBuy: () => void;
  onConnect: () => void;
}) {
  const targetSol = lamportsToSol(round.targetLamports);
  const raisedSol = lamportsToSol(round.raisedLamports);
  const unitPriceSol = lamportsToSol(round.unitPriceLamports);
  const pct = roundProgress(round.raisedLamports, round.targetLamports);
  const totalCost = (unitPriceSol * unitCount).toFixed(4);
  const remainingSol = Math.max(0, targetSol - raisedSol);
  const unitsLeft = unitPriceSol > 0 ? Math.floor(remainingSol / unitPriceSol) : 0;

  return (
    <motion.article
      className="fund-round glass-panel"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="fund-round__head">
        <div>
          <span className="fund-round__id">Round #{round.roundId}</span>
          <h3 className="fund-round__title">{round.description || "Acquisition round"}</h3>
        </div>
        <span className="fund-round__badge">Open</span>
      </div>

      <div className="fund-round__progress">
        <div className="fund-round__progress-bar">
          <div className="fund-round__progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="fund-round__progress-meta">
          <span>{raisedSol.toFixed(2)} / {targetSol.toFixed(2)} SOL</span>
          <span>{pct.toFixed(1)}% funded</span>
        </div>
      </div>

      <div className="fund-round__stats">
        <div>
          <span className="fund-round__stat-label">Unit price</span>
          <span className="fund-round__stat-value">{unitPriceSol.toFixed(4)} SOL</span>
        </div>
        <div>
          <span className="fund-round__stat-label">Units sold</span>
          <span className="fund-round__stat-value">{round.unitsSold.toNumber().toLocaleString()}</span>
        </div>
        <div>
          <span className="fund-round__stat-label">Est. units left</span>
          <span className="fund-round__stat-value">{unitsLeft.toLocaleString()}</span>
        </div>
      </div>

      <div className="fund-round__bundles">
        <span className="fund-round__bundles-label">Quick pick</span>
        <div className="fund-round__bundle-row">
          {UNIT_BUNDLES.map((b) => (
            <button
              key={b.id}
              type="button"
              className={`fund-bundle-btn ${selectedBundle === b.id ? "fund-bundle-btn--active" : ""}`}
              onClick={() => onBundle(b.id)}
            >
              <span className="fund-bundle-btn__label">{b.label}</span>
              <span className="fund-bundle-btn__units">{b.units} units</span>
              <span className="fund-bundle-btn__hint">{b.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="fund-round__error">{error}</p>}

      {connected ? (
        <div className="fund-round__buy">
          <div className="fund-round__buy-field">
            <label className="fund-round__buy-label">Units</label>
            <input
              type="number"
              min={1}
              max={Math.max(1, unitsLeft)}
              value={unitCountRaw}
              onChange={(e) => onUnitChange(e.target.value)}
              className="fund-round__input"
            />
          </div>
          <div className="fund-round__buy-field">
            <label className="fund-round__buy-label">Total</label>
            <div className="fund-round__total">{totalCost} SOL</div>
          </div>
          <button
            type="button"
            onClick={onBuy}
            disabled={buying}
            className="fund-round__buy-btn"
          >
            {buying ? "Confirming…" : "Buy units"}
          </button>
        </div>
      ) : (
        <button type="button" onClick={onConnect} className="fund-round__connect">
          Connect wallet to buy units
        </button>
      )}

      <p className="fund-round__fine">
        UNIT tokens mint to your wallet · Priority access when this round&apos;s inventory lists
      </p>
    </motion.article>
  );
}