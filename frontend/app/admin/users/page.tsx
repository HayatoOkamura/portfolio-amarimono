"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { backendUrl } from "@/app/utils/api";
import { PageLoading } from "@/app/components/ui/Loading/PageLoading";
import LoginModal from "@/app/components/ui/LoginModal/LoginModal";
import styles from "./users.module.scss";

interface User {
  id: string;
  email: string;
  username?: string;
  role?: string;
}

export default function UserManagementPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/users`);
      if (!response.ok) {
        throw new Error("ユーザー一覧の取得に失敗しました");
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError("ユーザー一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`${backendUrl}/api/users/role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          role: newRole,
        }),
      });

      if (!response.ok) {
        throw new Error("ロールの更新に失敗しました");
      }

      // ユーザー一覧を更新
      fetchUsers();
    } catch (err) {
      setError("ロールの更新に失敗しました");
    }
  };

  if (!user) {
    return <LoginModal onLogin={() => window.location.href = '/login'} />;
  }

  return (
    <PageLoading isLoading={loading}>
      <div className={styles.container}>
        <h1>ユーザー管理</h1>
        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.userList}>
          {users.map((user) => (
            <div key={user.id} className={styles.userItem}>
              <div className={styles.userInfo}>
                <p>メールアドレス: {user.email}</p>
                <p>ユーザー名: {user.username || "未設定"}</p>
                <p>現在のロール: {user.role || "user"}</p>
              </div>
              <div className={styles.roleControl}>
                <select
                  value={user.role || "user"}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                >
                  <option value="user">一般ユーザー</option>
                  <option value="admin">管理者</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLoading>
  );
} 