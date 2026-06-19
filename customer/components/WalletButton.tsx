import dynamic from "next/dynamic";

export const WalletButton = dynamic(
  async () => {
    const { WalletMultiButton } = await import("@solana/wallet-adapter-react-ui");
    return function Btn() {
      return (
        <WalletMultiButton
          style={{
            backgroundColor: "#d97706",
            borderRadius: "8px",
            fontSize: "14px",
            height: "38px",
            padding: "0 18px",
          }}
        />
      );
    };
  },
  { ssr: false }
);
