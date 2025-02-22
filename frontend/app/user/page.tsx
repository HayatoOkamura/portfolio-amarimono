/* eslint-disable */
"use client";

import { useAuth } from "@/app/hooks/useAuth";

export default function UserPage() {
  const { user } = useAuth();
  if (!user) return <p>Loading...</p>;

  return (
    <div>
      <p>{user ? `Welcome, ${user.email}` : "Not logged in"}</p>
      <h1>ユーザー情報</h1>
      <p>
        <strong>メール:</strong> {user.email}
      </p>
      <p>
        <strong>ユーザーID:</strong> {user.id}
      </p>
    </div>
  );
}
