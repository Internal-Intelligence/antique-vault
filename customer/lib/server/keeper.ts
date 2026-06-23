import { Keypair } from "@solana/web3.js";
import { getNftBayProgram } from "../nftbay";

function loadKeypairFromEnv(envName: string): Keypair | null {
  const raw = process.env[envName]?.trim();
  if (!raw) return null;
  try {
    const bytes = raw.startsWith("[")
      ? Uint8Array.from(JSON.parse(raw) as number[])
      : Uint8Array.from(Buffer.from(raw, "base64"));
    return Keypair.fromSecretKey(bytes);
  } catch {
    return null;
  }
}

export function loadKeeperKeypair(): Keypair | null {
  return (
    loadKeypairFromEnv("KEEPER_SECRET_KEY") ||
    loadKeypairFromEnv("INCENTIVE_BOT_SECRET_KEY")
  );
}

export function getKeeperProgram(connection: import("@solana/web3.js").Connection) {
  const keypair = loadKeeperKeypair();
  if (!keypair) return null;

  const wallet = {
    publicKey: keypair.publicKey,
    signTransaction: async (tx: any) => {
      tx.partialSign(keypair);
      return tx;
    },
    signAllTransactions: async (txs: any[]) => {
      txs.forEach((tx) => tx.partialSign(keypair));
      return txs;
    },
  };

  return getNftBayProgram(wallet as any, connection);
}