import Link from "next/link";
import { useRouter } from "next/router";

export default function SellPageHero({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const isEwasteMailin = router.query.program === "ewaste-mailin";

  return (
    <div className={compact ? "mb-6" : "mb-6"}>
      <Link href={isEwasteMailin ? "/profile?tab=expand" : "/"} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
        ← {isEwasteMailin ? "Back to profile" : "Back to home"}
      </Link>
      {isEwasteMailin ? (
        <>
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-400/90 mt-4 mb-2">Mail-in program</p>
          <h1 className="page-title">Mail e-waste, get SOL</h1>
          <p className="page-subtitle max-w-lg">
            Ship old devices under 15 lbs. SOL is held in escrow until the vault confirms your package arrived — then paid to your wallet.
          </p>
        </>
      ) : (
        <>
          <h1 className={`${compact ? "text-2xl" : "page-title"} mt-4`}>Sell on NFTBAY</h1>
          {!compact && (
            <p className="page-subtitle max-w-lg">
              Tap Sell for quick flashcards — then watch recently sold items fly while auctions go live soon.
            </p>
          )}
        </>
      )}
    </div>
  );
}