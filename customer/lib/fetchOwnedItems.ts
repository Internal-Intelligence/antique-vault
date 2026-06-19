import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Program } from "@coral-xyz/anchor";

export interface VaultItem {
  pda: PublicKey;
  itemId: string;
  name: string;
  nftMint: string;
  condition: number;
  appraisedValueUsdCents: number;
  status: number;
  mintedAt: number;
  shippingAddress: string;
  category: string;  // added for category metadata support
}

export async function fetchOwnedVaultItems(
  program: any,
  connection: Connection,
  owner: PublicKey
): Promise<VaultItem[]> {
  // Single RPC call: get all token accounts where this wallet holds amount=1 (NFTs)
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, {
    programId: TOKEN_PROGRAM_ID,
  });

  const ownedMints = new Set(
    tokenAccounts.value
      .filter((ta) => ta.account.data.parsed.info.tokenAmount.uiAmount === 1)
      .map((ta) => ta.account.data.parsed.info.mint as string)
  );

  if (ownedMints.size === 0) return [];

  // Fetch all vault item records, cross-reference with owned mints
  const allRecords = await program.account.itemRecord.all();

  return allRecords
    .filter(({ account }) => ownedMints.has(account.nftMint.toString()))
    .map(({ publicKey, account }) => ({
      pda: publicKey,
      itemId: account.itemId,
      name: account.name,
      nftMint: account.nftMint.toString(),
      condition: account.condition,
      appraisedValueUsdCents: account.appraisedValueUsdCents.toNumber(),
      status: account.status,
      mintedAt: account.mintedAt.toNumber(),
      shippingAddress: account.shippingAddress,
      category: (account as any).category || "Other",
    }));
}
