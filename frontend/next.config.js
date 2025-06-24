/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: process.env.ENVIRONMENT === 'development',
    remotePatterns: process.env.ENVIRONMENT === 'development' 
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
            hostname: 'qmrjsqeigdkizkrpiahs.supabase.co',
            port: '',
            pathname: '/storage/v1/object/public/images/**',
          }
        ],
    minimumCacheTTL: 60,
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
      : process.env.NEXT_PUBLIC_IMAGE_BASE_URL || 'https://qmrjsqeigdkizkrpiahs.supabase.co/storage/v1/object/public/images',
  },
  async rewrites() {
    // APIエンドポイントのみをリライト
    return [
      {
        source: '/api/:path*',
        destination: process.env.ENVIRONMENT === 'development'
          ? 'http://localhost:8080/api/:path*'
          : 'https://amarimono-backend.onrender.com/api/:path*',
      }
    ];
  },
  sassOptions: {
    includePaths: [require('path').join(__dirname, 'styles')],
  },
};

module.exports = nextConfig;