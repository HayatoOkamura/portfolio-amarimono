import axios, { AxiosInstance } from "axios";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export const api: AxiosInstance = axios.create({
  baseURL: backendUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// レスポンスインターセプター
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 現在のパスが認証関連ページでない場合のみリダイレクト
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath.startsWith('/login') || 
                        currentPath.startsWith('/signup') ||
                        currentPath.startsWith('/verify-email') ||
                        currentPath.startsWith('/callback') ||
                        currentPath.startsWith('/profile-setup');

      if (!isAuthPage) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
); 