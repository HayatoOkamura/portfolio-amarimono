import axios from "axios";
import { supabase } from "@/app/lib/api/supabase/supabaseClient";

// クライアントサイドとサーバーサイドで異なるURLを使用
export const backendUrl = typeof window !== 'undefined'
  ? process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
  : process.env.NEXT_PUBLIC_BACKEND_INTERNAL_URL || 'http://portfolio-amarimono_backend_1:8080';

export const imageBaseUrl = process.env.ENVIRONMENT === 'production'
    ? process.env.NEXT_PUBLIC_IMAGE_BASE_URL
    : process.env.NEXT_PUBLIC_LOCAL_IMAGE_URL;

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
