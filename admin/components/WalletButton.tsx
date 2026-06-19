import dynamic from "next/dynamic";

// Must be dynamic/no-SSR — wallet adapter reads browser globals
export const WalletButton = dynamic(
  async () => {
    const { WalletMultiButton } = await import("@solana/wallet-adapter-react-ui");
    return function Btn() {
      return (
        <WalletMultiButton
          style={{
            backgroundColor: "#d97706",
            borderRadius: "6px",
            fontSize: "14px",
            height: "36px",
            padding: "0 16px",
          }}
        />
      );
    };
  },
  { ssr: false }
);
