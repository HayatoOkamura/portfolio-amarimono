/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'portfolio-amarimono-backend.onrender.com',
        port: '',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'backend',
        port: '8080',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
        pathname: '/uploads/**',
      },
    ],
  },
  env: {
    // クライアントサイドでの API アクセス用
    BACKEND_URL: process.env.NODE_ENV === 'development' 
      ? 'http://localhost:8080'  // ブラウザからアクセスする時用
      : process.env.NEXT_PUBLIC_BACKEND_URL || 'https://portfolio-amarimono-backend.onrender.com',
    
    // 画像表示用
    IMAGE_BASE_URL: process.env.NODE_ENV === 'development'
      ? 'http://backend:8080'  // Docker内の画像表示用
      : process.env.NEXT_PUBLIC_IMAGE_BASE_URL || 'https://portfolio-amarimono-backend.onrender.com',
  },
  async rewrites() {
    // APIエンドポイントのみをリライト
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'development'
          ? 'http://localhost:8080/api/:path*'
          : 'https://portfolio-amarimono-backend.onrender.com/api/:path*',
      }
    ];
  },
  sassOptions: {
    includePaths: [require('path').join(__dirname, 'styles')],
  },
};

module.exports = nextConfig;