import axios from "axios";

// 開発環境と本番環境で異なるURLを使用
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
export const imageBaseUrl = process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_SUPABASE_IMAGE_URL
    : process.env.NEXT_PUBLIC_LOCAL_IMAGE_URL;

// APIクライアントの設定
export const api = axios.create({
  baseURL: backendUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// レスポンスハンドラ
export const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }
  return response.json();
};

export { backendUrl, imageBaseUrl };
