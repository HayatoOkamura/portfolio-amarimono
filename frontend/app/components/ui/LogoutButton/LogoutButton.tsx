"use client";

import { useUserStore } from "@/app/stores/userStore";

export default function LogoutButton() {
  const { signOut } = useUserStore();

  return <button onClick={signOut}>ログアウト</button>;
}
