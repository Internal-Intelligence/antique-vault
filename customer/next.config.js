/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@solana/wallet-adapter-base",
    "@solana/wallet-adapter-react",
    "@solana/wallet-adapter-react-ui",
    "@solana/wallet-adapter-phantom",
    "@solana/wallet-adapter-solflare",
  ],
  images: { domains: ["gateway.pinata.cloud", "arweave.net", "nftstorage.link"] },
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      path: false,
      os: false,
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      buffer: require.resolve("buffer"),
    };
    config.plugins.push(
      new (require("webpack").ProvidePlugin)({ Buffer: ["buffer", "Buffer"] })
    );
    return config;
  },
};

module.exports = nextConfig;
