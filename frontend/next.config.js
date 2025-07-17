/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // optimizeCss: true, // CSS最適化を一時的に無効化
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // 本番環境でconsole削除
  },
  webpack: (config, { isServer }) => {
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
    return config;
  },
  images: {
    unoptimized: true, // Cloudflare R2の課金制限を回避するため、画像最適化を無効化
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
            {
              protocol: 'http',
              hostname: '192.168.11.2',
              port: '8080',
              pathname: '/uploads/**',
            },
            {
              protocol: 'http',
              hostname: '192.168.11.2',
              port: '54321',
              pathname: '/storage/v1/object/public/images/**',
            },
            {
              protocol: 'http',
              hostname: 'host.docker.internal',
              port: '54321',
              pathname: '/storage/v1/object/public/images/**',
            }
          ]
        : [
            // 本番環境では特定のホストのみ許可
            {
              protocol: 'https',
              hostname: 'amarimono-backend.onrender.com',
              port: '',
              pathname: '/uploads/**',
            },
            {
              protocol: 'https',
              hostname: 'api.okamura.dev',
              port: '',
              pathname: '/uploads/**',
            },
            {
              protocol: 'https',
              hostname: 'qmrjsqeigdkizkrpiahs.supabase.co',
              port: '',
              pathname: '/storage/v1/object/public/images/**',
            },
            {
              protocol: 'https',
              hostname: 'pub-a63f718fe8894565998a27328e2d1b15.r2.dev', // Cloudflare R2のドメイン
              port: '',
              pathname: '/**',
            }
          ];
      
      // 本番環境でのデバッグ情報をログ出力
      if (process.env.ENVIRONMENT === 'production') {
        console.log('=== Next.js Image Configuration Debug ===');
        console.log('Environment:', process.env.ENVIRONMENT);
        console.log('NODE_ENV:', process.env.NODE_ENV);
        console.log('NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL:', process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL);
        console.log('Remote Patterns:', JSON.stringify(patterns, null, 2));
      }
      return patterns;
    })(),
    minimumCacheTTL: 86400, // 24時間に延長
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // 画像最適化の追加設定
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