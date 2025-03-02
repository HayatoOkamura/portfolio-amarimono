/* eslint-disable */
"use client";

import { useState } from "react";
import { useUserStore } from "@/app/stores/userStore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading] = useState(false);
  const { login } = useUserStore();

  const handleLogin = async () => {
    await login(email, password); // userStore内のlogin関数を呼び出す
  };

  return (
    <div>
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
      <button onClick={handleLogin} disabled={loading}>
        ログイン
      </button>
    </div>
  );
}
