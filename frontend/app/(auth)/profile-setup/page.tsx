"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import Loading from "@/app/components/ui/Loading/Loading";
import styles from "./ProfileSetup.module.scss";

export default function ProfileSetupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("username", username);
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${user?.id}`, {
        method: "PATCH",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "プロフィールの更新に失敗しました");
      }

      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "予期せぬエラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <div className={styles.profile_setup}>
        <Loading />
      </div>
    );
  }

  return (
    <div className={styles.profile_setup}>
      <div className={styles.profile_setup__container}>
        <h1>プロフィール設定</h1>
        <p>アカウントの基本情報を設定してください</p>
        
        <form onSubmit={handleSubmit} className={styles.profile_setup__form}>
          <div className={styles.profile_setup__form_group}>
            <label htmlFor="username">ユーザー名</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={2}
              maxLength={20}
              placeholder="2-20文字で入力してください"
            />
          </div>

          <div className={styles.profile_setup__form_group}>
            <label htmlFor="profileImage">プロフィール画像</label>
            <input
              id="profileImage"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {profileImage && (
              <div className={styles.profile_setup__image_preview}>
                <img
                  src={URL.createObjectURL(profileImage)}
                  alt="プロフィール画像プレビュー"
                />
              </div>
            )}
          </div>

          {error && <div className={styles.profile_setup__error}>{error}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.profile_setup__submit_button}
          >
            {isSubmitting ? "設定中..." : "プロフィールを設定"}
          </button>
        </form>
      </div>
    </div>
  );
} 