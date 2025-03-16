"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./edit.module.scss";
import { useUserStore } from "@/app/stores/userStore";
import { updateUserProfile } from "@/app/hooks/user";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const { user, isLoading, fetchUser } = useUserStore();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState("male");
  const [updating, setUpdating] = useState(false);

  // ユーザー情報を Zustand から取得
  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setAge(user.age || "");
      setGender(user.gender || "male");
      setPreviewImage(user.profileImage || "/default-avatar.png");
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("age", age !== "" ? String(age) : "");
      formData.append("gender", gender);
      if (profileImage) {
        formData.append("profileImage", profileImage); // File を送信
      }

      await updateUserProfile(user.id, formData);
      await fetchUser(); // Zustand の状態を更新

      alert("プロフィールを更新しました");
      router.push("/user");
    } catch {
      alert("プロフィールの更新に失敗しました");
    } finally {
      setUpdating(false);
    }
  };

  // 画像アップロード処理
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // 画像クリックでファイル選択を開く
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  if (isLoading) return <p>Loading...</p>;
  if (!user) return <p>ログインしてください</p>;

  return (
    <div className={styles.edit_block}>
      <div className={styles.edit_block__inner}>
        <form onSubmit={handleUpdateProfile}>
          <div className={styles.edit_block__head}>
            {/* プロフィール画像のアップロード */}
            <div
              className={styles.edit_block__img_wrap}
              onClick={handleImageClick}
            >
              <div className={styles.edit_block__img}>
                <Image
                  fill
                  src={previewImage || "/default-avatar.png"}
                  alt="Profile"
                  unoptimized
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
            </div>
            <div className={styles.edit_block__detail}>
              <div className={styles.item_block}>
                <div className={styles.item_block__sub}>
                  <label className={styles.item_block__title}>ユーザー名</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.item_block}>
                <div className={styles.item_block__sub}>
                  <label className={styles.item_block__title}>年齢</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) =>
                      setAge(e.target.value === "" ? "" : Number(e.target.value))
                    }
                  />
                </div>
                <div className={styles.item_block__sub}>
                  <label className={styles.item_block__title}>性別</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="male">男性</option>
                    <option value="female">女性</option>
                    <option value="other">その他</option>
                  </select>
                </div>
              </div>
              <button className={styles.edit_block__btn} type="submit" disabled={updating}>
                {updating ? "更新中..." : "更新"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
