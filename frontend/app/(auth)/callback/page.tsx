"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/api/supabase/supabaseClient";
import { useAuth } from "@/app/hooks/useAuth";
import Loading from "@/app/components/ui/Loading/Loading";
import styles from "./Callback.module.scss";

interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
  profileImage?: string;
  age?: number;
  gender?: string;
  email_confirmed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export default function AuthCallback() {
  const router = useRouter();
  const { setUser, createUserAfterVerification } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      // 既に初期化済みの場合は処理をスキップ
      if (hasInitializedRef.current) {
        console.log("Auth callback already initialized, skipping...");
        return;
      }
      hasInitializedRef.current = true;

      console.log("=== Auth Callback Start ===");
      
      try {
        // 1. セッションの取得
        console.log("Step 1: Fetching session...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error(`セッションの取得に失敗しました: ${sessionError.message}`);
        }

        if (!session) {
          throw new Error("認証セッションが見つかりません");
        }
        console.log("✅ Step 1: Session fetched successfully");

        // 2. ユーザー情報の取得
        console.log("Step 2: Fetching user data...");
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          throw new Error(`ユーザー情報の取得に失敗しました: ${userError.message}`);
        }

        if (!user) {
          throw new Error("ユーザー情報が見つかりません");
        }
        console.log("✅ Step 2: User data fetched successfully");

        // 3. メール認証が完了しているか確認
        console.log("Step 3: Checking email confirmation...");
        if (!user.email_confirmed_at) {
          throw new Error("メール認証が完了していません");
        }
        console.log("✅ Step 3: Email confirmed successfully");

        // 4. バックエンドにユーザーを作成
        console.log("Step 4: Creating backend user...");
        const userCreationResult = await createUserAfterVerification(user);
        
        if (!userCreationResult) {
          throw new Error("ユーザー情報の作成に失敗しました");
        }
        console.log("✅ Step 4: Backend user created successfully");

        // 5. 成功状態を設定
        console.log("Step 5: Setting success state...");
        setIsSuccess(true);
        setIsProcessing(false);
        console.log("✅ Step 5: Success state set successfully");

        // 6. リダイレクト
        console.log("Step 6: Scheduling redirect...");
        setTimeout(() => {
          console.log("✅ Step 6: Redirecting to profile setup...");
          router.push("/user/edit?setup=true");
        }, 2000);

      } catch (error) {
        console.error("❌ Auth Callback Error:", error);
        setError(error instanceof Error ? error.message : "認証処理に失敗しました");
        setIsProcessing(false);
        
        setTimeout(() => {
          console.log("Redirecting to login page due to error...");
          router.push("/login");
        }, 5000);
      }
    };

    handleAuthCallback();
  }, []);

  if (isProcessing) {
    return (
      <div className={styles.callback_container}>
        <div className={styles.loading_wrapper}>
          <div className={styles.loading_message}>
            <Loading />
            <p>認証処理中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.callback_container}>
        <div className={styles.error_message}>
          <h2>エラーが発生しました</h2>
          <p>{error}</p>
          <p>5秒後にログインページにリダイレクトされます...</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className={styles.callback_container}>
        <div className={styles.success_message}>
          <h2>認証成功</h2>
          <p>ユーザー登録が完了しました</p>
          <p>2秒後にプロフィール設定ページに移動します...</p>
        </div>
      </div>
    );
  }

  return null;
} 