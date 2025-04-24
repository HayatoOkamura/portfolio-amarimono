/* eslint-disable */
"use client";

import { useState } from "react";
import { supabase } from "@/app/lib/api/supabase/supabaseClient";
import { useUserStore } from "@/app/stores/userStore";
import { backendUrl } from "@/app/utils/api";
import { UserData } from "@/app/types/index";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useUserStore();

  const syncUserWithBackend = async (userData: UserData) => {
    try {
      const formData = new FormData();
      formData.append("id", userData.id);
      formData.append("email", userData.email);
      formData.append("username", userData.username ?? "");
      if (userData.profileImage) {
        formData.append("profileImage", userData.profileImage);
      }
      if (userData.age !== "") {
        formData.append("age", String(userData.age));
      }
      if (userData.gender) {
        formData.append("gender", userData.gender);
      }

      const res = await fetch(`${backendUrl}/api/users`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("ユーザーの同期に失敗しました");
      }
    } catch (error) {
      console.error("ユーザーの同期エラー:", error);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      alert(error.message);
    } else {
      setUser(data.user);

      if (data.user) {
        await syncUserWithBackend({
          id: data.user.id,
          email: data.user.email || "",
          username,
          profileImage,
          age,
          gender,
        });
      }

      alert("サインアップ成功！");
    }

    setLoading(false);
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
      <input
        type="text"
        placeholder="ユーザー名"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
      />
      <input
        type="number"
        placeholder="年齢 (任意)"
        value={age}
        onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
      />
      <select value={gender} onChange={(e) => setGender(e.target.value)}>
        <option value="">性別 (任意)</option>
        <option value="male">男性</option>
        <option value="female">女性</option>
        <option value="other">その他</option>
      </select>
      <button onClick={handleSignUp} disabled={loading}>
        サインアップ
      </button>
    </div>
  );
}
