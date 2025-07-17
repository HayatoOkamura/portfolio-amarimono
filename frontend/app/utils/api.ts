import axios from "axios";
import { supabase } from "@/app/lib/api/supabase/supabaseClient";

// クライアントサイドとサーバーサイドで異なるURLを使用
export const backendUrl = typeof window !== 'undefined'
  ? (() => {
      // クライアントサイドでは現在のホストに基づいてバックエンドURLを設定
      const currentHost = window.location.hostname;
      const currentPort = window.location.port;
      
      // 開発環境の場合、同じホストの8080ポートを使用
      if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        return 'http://localhost:8080';
      }
      
      // ローカルネットワークの場合（192.168.x.xなど）
      if (currentHost.match(/^192\.168\./) || currentHost.match(/^10\./) || currentHost.match(/^172\./)) {
        return `http://${currentHost}:8080`;
      }
      
      // 本番環境では新しいサブドメインを使用
      if (currentHost === 'amarimono.okamura.dev') {
        return 'https://amarimono-api.okamura.dev';
      }
      
      // その他の場合は環境変数を使用
      return process.env.NEXT_PUBLIC_BACKEND_URL || 'https://amarimono-api.okamura.dev';
    })()
  : process.env.NEXT_PUBLIC_BACKEND_INTERNAL_URL || 'http://portfolio-amarimono_backend_1:8080';

export const imageBaseUrl = typeof window !== 'undefined'
  ? (() => {
      // クライアントサイドでは現在のホストに基づいて画像URLを設定
      const currentHost = window.location.hostname;
      
      // 開発環境の場合、同じホストの54321ポートを使用
      if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        return 'http://localhost:54321/storage/v1/object/public/images';
      }
      
      // ローカルネットワークの場合（192.168.x.xなど）
      if (currentHost.match(/^192\.168\./) || currentHost.match(/^10\./) || currentHost.match(/^172\./)) {
        return `http://${currentHost}:54321/storage/v1/object/public/images`;
      }
      
      // 本番環境ではCloudflare R2のURLを使用
      if (currentHost === 'amarimono.okamura.dev') {
        return process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-a63f718fe8894565998a27328e2d1b15.r2.dev';
      }
      
      // その他の場合は環境変数を使用
      return process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-a63f718fe8894565998a27328e2d1b15.r2.dev';
    })()
  : process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-a63f718fe8894565998a27328e2d1b15.r2.dev';

// axiosインスタンスの作成
export const api = axios.create({
  baseURL: backendUrl,
  withCredentials: true, // クッキーを含めるために必要
  headers: {
    "Content-Type": "application/json",
  },
});

// リクエストインターセプターの設定
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// レスポンスインターセプターの設定
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// レスポンスハンドラ
export const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }
  return response.json();
};
