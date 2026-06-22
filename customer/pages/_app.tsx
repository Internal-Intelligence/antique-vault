import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import "../styles/globals.css";

const WalletContextProvider = dynamic(() => import("../components/WalletContextProvider"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#30d158",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
        letterSpacing: "0.05em",
      }}
    >
      Loading NFTBAY…
    </div>
  ),
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WalletContextProvider>
      <Component {...pageProps} />
    </WalletContextProvider>
  );
}