import { useCallback, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  computeMinNextBidLamports,
  getNftBayProgram,
  placeAuctionBid,
} from "../lib/nftbay";

export function useAuctionBid() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [biddingMint, setBiddingMint] = useState<string | null>(null);

  const placeBid = useCallback(
    async (opts: {
      listingPda: string;
      nftMint: string;
      bidLamports: number;
      highestBidLamports: number;
      reserveLamports: number;
      highestBidder?: string;
    }) => {
      if (!wallet.connected || !wallet.publicKey) {
        throw new Error("Connect wallet to bid");
      }

      const minBid = computeMinNextBidLamports(opts.highestBidLamports, opts.reserveLamports);
      if (opts.bidLamports < minBid) {
        throw new Error(`Bid must be at least ${(minBid / 1e9).toFixed(4)} SOL`);
      }

      setBiddingMint(opts.nftMint);
      try {
        const program = getNftBayProgram(wallet as any, connection);
        const listingPk = new PublicKey(opts.listingPda);
        let prevBidder: PublicKey | undefined;
        if (
          opts.highestBidLamports > 0 &&
          opts.highestBidder &&
          opts.highestBidder !== PublicKey.default.toString()
        ) {
          prevBidder = new PublicKey(opts.highestBidder);
        }
        await placeAuctionBid(
          program,
          listingPk,
          wallet.publicKey,
          new BN(opts.bidLamports),
          prevBidder
        );
      } finally {
        setBiddingMint(null);
      }
    },
    [connection, wallet]
  );

  return { placeBid, biddingMint, isBidding: (mint: string) => biddingMint === mint };
}