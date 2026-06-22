import Link from "next/link";

interface ProfileVerificationCardProps {
  itemCount: number;
  inCustody: number;
}

export default function ProfileVerificationCard({ itemCount, inCustody }: ProfileVerificationCardProps) {
  return (
    <section className="profile-card profile-card--span profile-verification-card">
      <div className="profile-card__head">
        <div>
          <p className="profile-card__eyebrow">Verification hub</p>
          <h2 className="profile-card__title">NFTBAY warehouse</h2>
          <p className="profile-card__sub mt-1">
            {itemCount > 0
              ? `${inCustody} in custody · ${itemCount - inCustody} listed or pawned`
              : "Items verify here before they trade on-chain"}
          </p>
        </div>
        <span className="profile-verification-badge" title="Central custody hub">
          Austin hub
        </span>
      </div>
      <p className="profile-card__body">
        Intake scan, condition grade, insured storage, and Q-HASH trust chain — every NFT maps to a
        physical unit that passed through the warehouse.
      </p>
      <div className="flex flex-wrap gap-2 mt-4">
        <Link href="/warehouse" className="btn-secondary text-sm">
          How verification works
        </Link>
        <Link href="/sell" className="home-ghost-btn text-sm min-h-[36px]">
          Ship to warehouse →
        </Link>
      </div>
    </section>
  );
}