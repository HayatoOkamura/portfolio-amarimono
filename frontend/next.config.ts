/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true, // SWCによる高速なminify
  experimental: {
    optimizePackageImports: ["@chakra-ui/react"],
    reactRoot: true,  // Reactの新しいroot APIを使う（レガシーコンポーネントのパフォーマンス向上）
    concurrentFeatures: true, // Concurrent Modeを有効にする（パフォーマンス向上）
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
        pathname: '/uploads/**',
      },
    ],
  },
};

module.exports = nextConfig;
