import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import {
  createNft,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { generateSigner, percentAmount } from "@metaplex-foundation/umi";
import { WalletContextState } from "@solana/wallet-adapter-react";

/// MINT — Final step of IMAGE API + AI VALUATION intake.
/// NFT carries the quantum seed (appraised + category + isWorking metadata)
export async function mintCollectibleNft(
  wallet: WalletContextState,
  rpcEndpoint: string,
  metadataUri: string,
  name: string
): Promise<string> {
  const umi = createUmi(rpcEndpoint)
    .use(mplTokenMetadata())
    .use(walletAdapterIdentity(wallet as any));

  const mint = generateSigner(umi);

  await createNft(umi, {
    mint,
    name,
    uri: metadataUri,
    sellerFeeBasisPoints: percentAmount(5), // 5% royalty on secondary sales
    isMutable: false,
  }).sendAndConfirm(umi, { confirm: { commitment: "confirmed" } });

  return mint.publicKey.toString();
}
