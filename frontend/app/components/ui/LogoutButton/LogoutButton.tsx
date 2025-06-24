"use client";

import { useAuth } from "@/app/hooks/useAuth";

export default function LogoutButton() {
  const { logout } = useAuth();

  return <button onClick={logout}>ログアウト</button>;
}
