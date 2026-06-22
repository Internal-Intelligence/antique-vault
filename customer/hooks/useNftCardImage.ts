import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { fetchNftImage } from "../lib/burn";

export interface UseNftCardImageResult {
  image: string | null;
  loading: boolean;
}

export function useNftCardImage(
  nftMint: string,
  initialImage: string | null | undefined,
  rpcEndpoint: string,
): UseNftCardImageResult {
  const [image, setImage] = useState<string | null>(initialImage ?? null);
  const [loading, setLoading] = useState(!initialImage);

  useEffect(() => {
    if (initialImage) {
      setImage(initialImage);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchNftImage(nftMint, rpcEndpoint).then((img) => {
      if (cancelled) return;
      if (img) setImage(img);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [nftMint, initialImage, rpcEndpoint]);

  return { image, loading };
}