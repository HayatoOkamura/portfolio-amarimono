import axios from "axios";

// クライアントサイドとサーバーサイドで異なるURLを使用
export const backendUrl = typeof window !== 'undefined'
  ? process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
  : process.env.NEXT_PUBLIC_BACKEND_INTERNAL_URL || 'http://portfolio-amarimono_backend_1:8080';

export const imageBaseUrl = process.env.NODE_ENV === 'production'
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
