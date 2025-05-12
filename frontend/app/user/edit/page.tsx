"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./edit.module.scss";
import { useUserStore } from "@/app/stores/userStore";
import { updateUserProfile } from "@/app/hooks/user";
import { useRouter, useSearchParams } from "next/navigation";
import { LuImagePlus } from "react-icons/lu";
import { PageLoading } from "@/app/components/ui/Loading/PageLoading";

function EditProfileContent() {
  const { user, isLoading, fetchUser } = useUserStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSetupMode = searchParams.get("setup") === "true";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState("male");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  // ユーザー情報を Zustand から取得
  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setAge(user.age || "");
      setGender(user.gender || "male");
      setPreviewImage(user.profileImage || null);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setUpdating(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("age", age !== "" ? String(age) : "");
      formData.append("gender", gender);
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      await updateUserProfile(user.id, formData);
      await fetchUser();

      if (isSetupMode) {
        alert("プロフィールの設定が完了しました");
        router.push("/");
      } else {
        alert("プロフィールを更新しました");
        router.push("/user");
      }
    } catch (err) {
      setError("プロフィールの更新に失敗しました");
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
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 画像クリックでファイル選択を開く
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  if (!user) return <p>ログインしてください</p>;

  return (
    <PageLoading isLoading={isLoading}>
      <div className={styles.edit_block}>
        <div className={styles.edit_block__inner}>
          <h1>{isSetupMode ? "プロフィール設定" : "プロフィール編集"}</h1>
          <p>{isSetupMode && "アカウントの基本情報を設定してください"}</p>
          <form onSubmit={handleUpdateProfile}>
            <div className={styles.edit_block__head}>
              {/* プロフィール画像のアップロード */}
              <div
                className={styles.edit_block__img_wrap}
                onClick={handleImageClick}
              >
                <div className={styles.edit_block__img}>
                  {previewImage ? (
                    <Image
                      src={previewImage}
                      alt="Profile"
                      width={100}
                      height={100}
                    />
                  ) : (
                    <div className={styles.edit_block__placeholder}>
                      <div className={styles.edit_block__icon}>
                        <LuImagePlus />
                      </div>
                      <div className={styles.edit_block__uploadText}>
                        <label className={styles.edit_block__uploadLabel}>
                          プロフィール画像をアップロード
                        </label>
                      </div>
                      <p className={styles.edit_block__fileInfo}>
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  )}
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
                      required
                      minLength={2}
                      maxLength={20}
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
                        setAge(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
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
                {error && <div className={styles.error_message}>{error}</div>}
                <button
                  className={styles.edit_block__btn}
                  type="submit"
                  disabled={updating}
                >
                  {updating
                    ? "更新中..."
                    : isSetupMode
                      ? "プロフィールを設定"
                      : "更新"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </PageLoading>
  );
}

export default function EditProfilePage() {
  return <EditProfileContent />;
}
