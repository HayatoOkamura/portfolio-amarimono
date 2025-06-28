"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { useAdmin } from "@/app/hooks/useAdmin";
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
  const { loading, error, fetchUsers, updateUserRole } = useAdmin();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await fetchUsers();
        setUsers(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
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