/* eslint-disable */
"use client";

import { useAuth } from "@/app/hooks/useAuth";

export default function UserPage() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <p>Loading...</p>;
  if (!user) return <p>Redirecting to login...</p>;

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
