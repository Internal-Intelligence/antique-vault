import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { IDL } from "./idl";

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || "FnYhRhWkpALRFhm59FSmUeEaCRLvtQCXV2PVL5Hiz3WL"
);

export function getProgram(wallet: WalletContextState, connection: Connection) {
  const provider = new AnchorProvider(connection, wallet as any, {
    commitment: "confirmed",
  });
  return new Program(IDL as any, provider) as any;
}

export const CONDITIONS = ["Poor", "Fair", "Good", "Very Good", "Excellent", "Mint"];
