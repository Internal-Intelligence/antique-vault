import dynamic from "next/dynamic";

function PhantomIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      aria-hidden
      className="ios-wallet-icon shrink-0"
    >
      <rect width="128" height="128" rx="28" fill="#AB9FF2" />
      <path
        fill="#fff"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M64 96c-18 0-32-10-40-24-8-14-8-32 0-46 8-14 22-24 40-24s32 10 40 24c8 14 8 32 0 46-8 14-22 24-40 24zm-8-44a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm32 0a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"
      />
    </svg>
  );
}

export const WalletButton = dynamic(
  async () => {
    const { useWallet } = await import("@solana/wallet-adapter-react");
    const { useWalletModal } = await import("@solana/wallet-adapter-react-ui");

    return function WalletBtnInner() {
      const { publicKey, connected } = useWallet();
      const { setVisible } = useWalletModal();

      const open = () => setVisible(true);

      if (connected && publicKey) {
        const addr = publicKey.toBase58();
        const short = `${addr.slice(0, 4)}…${addr.slice(-4)}`;
        return (
          <button type="button" className="ios-wallet-btn ios-wallet-btn--connected ios-wallet-btn--module" onClick={open}>
            <PhantomIcon size={18} />
            <span className="ios-wallet-label">{short}</span>
          </button>
        );
      }

      return (
        <button type="button" className="ios-wallet-btn ios-wallet-btn--module" onClick={open}>
          <PhantomIcon />
          <span className="ios-wallet-label">Connect</span>
        </button>
      );
    };
  },
  { ssr: false }
);