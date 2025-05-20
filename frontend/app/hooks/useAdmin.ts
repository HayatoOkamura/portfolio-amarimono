import { useState, useEffect } from 'react';
import { backendUrl } from "@/app/utils/api";
import { useAuth } from './useAuth';

interface User {
  id: string;
  email: string;
  username?: string;
  role?: string;
}

export const useAdmin = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(user?.role === 'admin');
  }, [user]);

  const fetchUsers = async (): Promise<User[]> => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${backendUrl}/api/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        throw new Error("ユーザー一覧の取得に失敗しました");
      }
      return await response.json();
    } catch (err) {
      setError("ユーザー一覧の取得に失敗しました");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string): Promise<void> => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${backendUrl}/api/users/role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          user_id: userId,
          role: newRole,
        }),
      });

      if (!response.ok) {
        throw new Error("ロールの更新に失敗しました");
      }
    } catch (err) {
      setError("ロールの更新に失敗しました");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    isAdmin,
    isLoading: loading,
    fetchUsers,
    updateUserRole,
  };
}; 