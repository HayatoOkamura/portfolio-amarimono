"use client";

import { backendUrl } from "@/app/utils/apiUtils";
import { useState } from "react";
import { supabase } from "@/app/lib/api/supabase/supabaseClient";
import { useUserStore } from "@/app/stores/userStore";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useUserStore();

  const syncUserWithBackend = async (userId: string, email: string) => {
    try {
      const res = await fetch(`${backendUrl}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, email }),
      });

      if (!res.ok) {
        throw new Error("ユーザーの同期に失敗しました");
      }
    } catch (error) {
      console.error("ユーザーの同期エラー:", error);
    }
  };

  const handleAuth = async (isSignUp: boolean) => {
    setLoading(true);
    const { data, error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert(error.message);
    } else {
      setUser(data.user);

      if (isSignUp && data.user) {
        await syncUserWithBackend(data.user.id, data.user.email || "");
      }
      
      alert(isSignUp ? "サインアップ成功！" : "ログイン成功！");
    }

    setLoading(false);
  };

  return (
    <div>
      <h2>ログイン / サインアップ</h2>
      <input
        type="email"
        placeholder="メールアドレス"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="パスワード"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={() => handleAuth(false)} disabled={loading}>
        ログイン
      </button>
      <button onClick={() => handleAuth(true)} disabled={loading}>
        サインアップ
      </button>
    </div>
  );
}
