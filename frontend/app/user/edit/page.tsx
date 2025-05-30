"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./edit.module.scss";
import { useUserStore } from "@/app/stores/userStore";
import { updateUserProfile, useUser } from "@/app/hooks/user";
import { useRouter, useSearchParams } from "next/navigation";
import { LuImagePlus } from "react-icons/lu";
import { PageLoading } from "@/app/components/ui/Loading/PageLoading";
import { imageBaseUrl } from "@/app/utils/api";
import { withAuth } from "@/app/components/auth/withAuth";

interface User {
  id: string;
  email: string;
  username?: string;
  profileImage?: string;
  age?: number;
  gender?: string;
  email_confirmed_at?: string;
  created_at?: string;
  updated_at?: string;
}

function EditProfileContent() {
  const { user: authUser, isLoading: isAuthLoading, fetchUser } = useUserStore();
  const { user: userDetails, loading: isUserLoading, error: userError } = useUser(authUser?.id);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSetupMode = searchParams.get("setup") === "true";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState("未設定");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [showAuthError, setShowAuthError] = useState(false);

  // ユーザー情報を設定
  useEffect(() => {
    if (userDetails) {
      setUsername(userDetails.username || "");
      setAge(userDetails.age || "");
      setGender(userDetails.gender || "未設定");
      if (userDetails.profileImage) {
        setPreviewImage(`${imageBaseUrl}/${userDetails.profileImage}`);
      }
    }
  }, [userDetails]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    console.log("handleUpdateProfile");
    e.preventDefault();
    
    if (!authUser?.id) {
      setShowAuthError(true);
      return;
    }

    setUpdating(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("age", age !== "" ? String(age) : "");
      formData.append("gender", gender);
      if (profileImage) {
        formData.append("profile_image", profileImage);
      }

      await updateUserProfile(authUser.id, formData);
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

  if (showAuthError) {
    return (
      <div className={styles.edit_block}>
        <div className={styles.edit_block__inner}>
          <div className={styles.error_container}>
            <h2 className={styles.error_title}>認証エラー</h2>
            <p className={styles.error_message}>
              ユーザー情報の取得に失敗しました。<br />
              再度ログインしてください。
            </p>
            <button
              className={styles.error_button}
              onClick={() => router.push('/login')}
            >
              ログインページへ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageLoading isLoading={isAuthLoading || isUserLoading}>
      <div className={styles.edit_block}>
        <div className={styles.edit_block__inner}>
          <h1 className={styles.edit_block__title}>{isSetupMode ? "プロフィール設定" : "プロフィール編集"}</h1>
          <p className={styles.edit_block__description}>{isSetupMode && "アカウントの基本情報を設定してください"}</p>
          <form onSubmit={handleUpdateProfile} className={styles.edit_block__form}>
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
                      <option value="未設定">未設定</option>
                      <option value="男性">男性</option>
                      <option value="女性">女性</option>
                      <option value="その他">その他</option>
                    </select>
                  </div>
                </div>
                {(error || userError) && (
                  <div className={styles.form_error}>
                    {error || userError}
                  </div>
                )}
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

function EditProfilePage() {
  return <EditProfileContent />;
}

export default withAuth(EditProfilePage);
