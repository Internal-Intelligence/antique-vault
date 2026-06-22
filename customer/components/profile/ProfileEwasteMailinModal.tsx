import Link from "next/link";
import { IosModal } from "../IosModal";

interface ProfileEwasteMailinModalProps {
  onClose: () => void;
}

const STEPS = [
  {
    n: "1",
    title: "Request a label",
    desc: "Connect wallet, describe what you're mailing. We generate a prepaid label and quote in SOL.",
  },
  {
    n: "2",
    title: "Ship your package",
    desc: "Mail phones, laptops, cables, or other e-waste under 15 lbs. Track delivery from your profile.",
  },
  {
    n: "3",
    title: "Vault confirms receipt",
    desc: "Our warehouse scans and logs arrival on-chain. Your shipment must be verified before any payout.",
  },
  {
    n: "4",
    title: "SOL released to you",
    desc: "Funds sit in escrow until confirmation — then SOL hits your wallet automatically. No crypto sent upfront.",
  },
];

export default function ProfileEwasteMailinModal({ onClose }: ProfileEwasteMailinModalProps) {
  return (
    <IosModal onClose={onClose}>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-emerald-400/90 mb-1">Profile program</p>
        <h2 className="text-xl font-semibold tracking-tight mb-2">Mail-in e-waste → SOL</h2>
        <p className="text-sm text-zinc-400 leading-relaxed mb-5">
          An optional recycling lane inside your profile — not the whole marketplace. Turn old devices into SOL
          with escrow until we confirm your shipment landed safely.
        </p>

        <ol className="space-y-3 mb-6">
          {STEPS.map((step) => (
            <li key={step.n} className="flex gap-3">
              <span className="profile-ewaste-step-num">{step.n}</span>
              <div>
                <p className="text-sm font-medium text-zinc-200">{step.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-200/80 mb-5">
          <strong className="text-amber-300">Safety:</strong> SOL is never sent before vault receipt is confirmed on-chain.
          Under 15 lbs per package. ID verification on first mail-in.
        </div>

        <Link
          href="/sell?program=ewaste-mailin"
          className="btn-primary w-full text-center"
          onClick={onClose}
        >
          Start mail-in
        </Link>
        <button type="button" onClick={onClose} className="profile-text-btn mt-4 mx-auto block">
          Close
        </button>
      </div>
    </IosModal>
  );
}