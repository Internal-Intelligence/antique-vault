import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import {
  burnV1,
  mplTokenMetadata,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import { publicKey as umiPublicKey } from "@metaplex-foundation/umi";
import { WalletContextState } from "@solana/wallet-adapter-react";

export async function burnVaultNft(
  wallet: WalletContextState,
  rpcEndpoint: string,
  mintAddress: string
): Promise<void> {
  const umi = createUmi(rpcEndpoint)
    .use(mplTokenMetadata())
    .use(walletAdapterIdentity(wallet as any));

  await burnV1(umi, {
    mint: umiPublicKey(mintAddress),
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi, { confirm: { commitment: "confirmed" } });
}

export async function fetchNftImage(
  mintAddress: string,
  rpcEndpoint: string
): Promise<string | null> {
  try {
    const { createUmi: makeUmi } = await import("@metaplex-foundation/umi-bundle-defaults");
    const { mplTokenMetadata: mplMeta, fetchDigitalAsset } = await import(
      "@metaplex-foundation/mpl-token-metadata"
    );
    const { publicKey: pk } = await import("@metaplex-foundation/umi");

    const umi = makeUmi(rpcEndpoint).use(mplMeta());
    const asset = await fetchDigitalAsset(umi, pk(mintAddress));
    if (!asset.metadata.uri) return null;
    const meta = await fetch(asset.metadata.uri).then((r) => r.json());
    return meta.image || null;
  } catch {
    return null;
  }
}
