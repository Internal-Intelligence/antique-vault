import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import { Analytics } from "@vercel/analytics/next";
import AppLoadingSplash from "../components/AppLoadingSplash";
import "../styles/globals.css";

const WalletContextProvider = dynamic(() => import("../components/WalletContextProvider"), {
  ssr: false,
  loading: () => <AppLoadingSplash />,
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WalletContextProvider>
      <Component {...pageProps} />
      <Analytics />
    </WalletContextProvider>
  );
}