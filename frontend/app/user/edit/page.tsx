"use client";

import { useState, useEffect } from "react";
import styles from "./edit.module.scss";
import { useUserStore } from "@/app/stores/userStore";
import { updateUserProfile, useUser } from "@/app/hooks/user";
import { useRouter, useSearchParams } from "next/navigation";
import { PageLoading } from "@/app/components/ui/Loading/PageLoading";
import { withAuth } from "@/app/components/auth/withAuth";
import { toast } from "react-hot-toast";
import { useImageUpload } from "@/app/components/features/RecipeForm/hooks/useImageUpload";
import { LuImagePlus } from "react-icons/lu";
import Image from "next/image";

function EditProfileContent() {
  const { user: authUser, isLoading: isAuthLoading } = useUserStore();
  const {
    user: userDetails,
    loading: isUserLoading,
    error: userError,
  } = useUser(authUser?.id);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSetupMode = searchParams.get("setup") === "true";
  const { handleImageChange, getImageUrl } = useImageUpload();

  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState<File | undefined>(undefined);
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(undefined);
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
        setProfileImageUrl(userDetails.profileImage);
      }
    }
  }, [userDetails]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;

    setUpdating(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("age", age.toString());
      formData.append("gender", gender);
      if (profileImage) {
        formData.append("image", profileImage);
      }

      await updateUserProfile(authUser.id, formData);
      toast.success("プロフィールを更新しました");
      if (isSetupMode) {
        alert("プロフィールの設定が完了しました");
        router.push("/");
      } else {
        router.push("/user");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      let errorMessage = "プロフィールの更新に失敗しました";
      
      // エラーメッセージの詳細化
      if (error instanceof Error) {
        if (error.message.includes("500")) {
          errorMessage = "サーバーエラーが発生しました。しばらく時間をおいて再度お試しください。";
        } else if (error.message.includes("timeout")) {
          errorMessage = "リクエストがタイムアウトしました。ネットワーク接続を確認してください。";
        } else if (error.message.includes("network")) {
          errorMessage = "ネットワークエラーが発生しました。接続を確認してください。";
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  // 画像アップロード処理
  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const result = await handleImageChange(e);
    if (result) {
      setProfileImage(result.image);
      setProfileImageUrl(result.imageUrl);
    }
  };

  const currentImageUrl = getImageUrl(profileImageUrl, profileImage);

  if (showAuthError) {
    return (
      <div className={styles.edit_block}>
        <div className={styles.edit_block__inner}>
          <div className={styles.error_container}>
            <h2 className={styles.error_title}>認証エラー</h2>
            <p className={styles.error_message}>
              ユーザー情報の取得に失敗しました。
              <br />
              再度ログインしてください。
            </p>
            <button
              className={styles.error_button}
              onClick={() => router.push("/login")}
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
          <h1 className={styles.edit_block__title}>
            {isSetupMode ? "プロフィール設定" : "プロフィール編集"}
          </h1>
          {isSetupMode && (
            <div className={styles.edit_block__description}>
              <p>アカウントの基本情報を設定してください</p>
              <p>設定した情報は、ユーザーのプロフィールに表示されます</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className={styles.edit_block__form}>
            <div className={styles.edit_block__head}>
              {/* プロフィール画像のアップロード */}
              <div className={styles.edit_block__img_wrap}>
                {currentImageUrl ? (
                  <div className={styles.edit_block__img_container}>
                    <Image
                      src={currentImageUrl}
                      alt="Profile"
                      width={200}
                      height={200}
                      className={styles.edit_block__img}
                    />
                    <div className={styles.edit_block__img_overlay}>
                      <span className={styles.edit_block__img_overlay_text}>
                        画像を変更
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className={styles.edit_block__img_input}
                    />
                  </div>
                ) : (
                  <div className={styles.edit_block__img_placeholder}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className={styles.edit_block__img_input}
                    />
                    <div className={styles.edit_block__img_placeholder_content}>
                      <div className={styles.edit_block__img_icon}>
                        <LuImagePlus />
                      </div>
                      <div className={styles.edit_block__img_upload_text}>
                        <label className={styles.edit_block__img_upload_label}>
                          プロフィール画像を<br />アップロード
                        </label>
                      </div>
                      <p className={styles.edit_block__img_file_info}>
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className={styles.edit_block__detail}>
                <div className={styles.item_block}>
                  <div className={styles.item_block__sub}>
                    <label className={styles.item_block__title}>
                      ユーザー名
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="ユーザー名を入力してください"
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
                      placeholder="年齢を入力してください"
                      min="1"
                      max="120"
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
                  <div className={styles.form_error}>{error || userError}</div>
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
                    : "プロフィールを更新"}
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
