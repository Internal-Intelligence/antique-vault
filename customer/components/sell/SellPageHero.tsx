import Link from "next/link";
import { useRouter } from "next/router";

export default function SellPageHero() {
  const router = useRouter();
  const isEwasteMailin = router.query.program === "ewaste-mailin";

  return (
    <div className="mb-10">
      <Link href={isEwasteMailin ? "/profile" : "/"} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
        ← {isEwasteMailin ? "Back to profile" : "Back to vault"}
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
          <h1 className="page-title mt-4">List an item</h1>
          <p className="page-subtitle max-w-lg">
            Tokenize anything physical — phones, collectibles, gear, and more. AI valuation, vault custody, trade on the marketplace or redeem.
          </p>
        </>
      )}
    </div>
  );
}