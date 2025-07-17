/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // optimizeCss: true, // CSS最適化を一時的に無効化
    optimizePackageImports: ['react-icons', 'framer-motion', '@dnd-kit/core', '@dnd-kit/sortable'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // 本番環境でconsole削除
  },
  // 静的生成のタイムアウト設定を延長
  staticPageGenerationTimeout: 300,
  webpack: (config, { isServer, dev }) => {
    // webpack-bundle-analyzerの設定
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: '../bundle-analyzer-report.html',
        })
      );
    }

    // 本番環境での最適化
    if (!dev && !isServer) {
      // コード分割の最適化
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };
    }

    return config;
  },
  images: {
    unoptimized: false, // 画像最適化を有効化
    remotePatterns: (() => {
      const patterns = process.env.ENVIRONMENT === 'development' 
        ? [
            // 開発環境ではすべてのローカルホストを許可
            {
              protocol: 'http',
              hostname: 'localhost',
              port: '8080',
              pathname: '/uploads/**',
            },
            {
              protocol: 'http',
              hostname: 'localhost',
              port: '54321',
              pathname: '/storage/v1/object/public/images/**',
            },
            {
              protocol: 'http',
              hostname: '127.0.0.1',
              port: '8080',
              pathname: '/uploads/**',
            },
            {
              protocol: 'http',
              hostname: '127.0.0.1',
              port: '54321',
              pathname: '/storage/v1/object/public/images/**',
            },
          ]
        : [
            // 本番環境では特定のドメインのみ許可
            {
              protocol: 'https',
              hostname: 'qmrjsqeigdkizkrpiahs.supabase.co',
              pathname: '/storage/v1/object/public/images/**',
            },
            {
              protocol: 'https',
              hostname: 'portfolio-amarimono-backend.onrender.com',
              pathname: '/uploads/**',
            },
            // Cloudflare R2の画像ドメイン
            {
              protocol: 'https',
              hostname: 'pub-a63f718fe8894565998a27328e2d1b15.r2.dev',
              pathname: '/**',
            },
          ];
      return patterns;
    })(),
    // 画像最適化の詳細設定
    minimumCacheTTL: 86400, // 24時間
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  env: {
    // クライアントサイドでの API アクセス用
    BACKEND_URL: process.env.ENVIRONMENT === 'development' 
      ? 'http://localhost:8080'  // ブラウザからアクセスする時用
      : process.env.NEXT_PUBLIC_BACKEND_URL || 'https://amarimono-backend.onrender.com',
    
    // 画像表示用
    IMAGE_BASE_URL: process.env.ENVIRONMENT === 'development'
      ? 'http://localhost:54321/storage/v1/object/public/images'  // ブラウザからアクセスする時用
      : process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-a63f718fe8894565998a27328e2d1b15.r2.dev',
  },
  async rewrites() {
    // APIエンドポイントのみをリライト
    return [
      {
        source: '/api/:path*',
        destination: process.env.ENVIRONMENT === 'development'
          ? 'http://localhost:8080/api/:path*'
          : 'https://amarimono-api.okamura.dev/api/:path*',
      }
    ];
  },
  sassOptions: {
    includePaths: [require('path').join(__dirname, 'styles')],
  },
};

// 本番環境でのデバッグ情報をログ出力
if (process.env.ENVIRONMENT === 'production') {
  console.log('=== Next.js Config Debug ===');
  console.log('Environment:', process.env.ENVIRONMENT);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('IMAGE_BASE_URL:', nextConfig.env.IMAGE_BASE_URL);
  console.log('BACKEND_URL:', nextConfig.env.BACKEND_URL);
}

module.exports = nextConfig;