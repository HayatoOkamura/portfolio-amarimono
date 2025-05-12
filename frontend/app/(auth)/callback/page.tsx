"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/api/supabase/supabaseClient";
import { useAuth } from "@/app/hooks/useAuth";
import styles from "./Callback.module.scss";

export default function AuthCallback() {
  const router = useRouter();
  const { setUser, createUserAfterVerification } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setIsProcessing(true);

        // 1. セッションの取得
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log("Session check:", { session, error: sessionError });

        if (sessionError) {
          throw new Error(`セッションの取得に失敗しました: ${sessionError.message}`);
        }

        if (!session) {
          throw new Error("認証セッションが見つかりません");
        }

        // 2. ユーザー情報の取得
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log("User check:", { user, error: userError });

        if (userError) {
          throw new Error(`ユーザー情報の取得に失敗しました: ${userError.message}`);
        }

        if (!user) {
          throw new Error("ユーザー情報が見つかりません");
        }

        // 3. メール認証が完了しているか確認
        if (!user.email_confirmed_at) {
          throw new Error("メール認証が完了していません");
        }

        // 4. バックエンドにユーザーを作成
        try {
          const userCreationResult = await createUserAfterVerification(user);
          console.log("User creation result:", userCreationResult);
          
          if (!userCreationResult) {
            throw new Error("ユーザー情報の作成に失敗しました");
          }

          // 成功した場合は即座にプロフィール設定ページにリダイレクト
          router.push("/user/edit?setup=true");
        } catch (creationError) {
          console.error("ユーザー作成エラー:", creationError);
          throw new Error(`ユーザー作成に失敗しました: ${creationError instanceof Error ? creationError.message : "不明なエラー"}`);
        }

      } catch (err) {
        console.error("認証エラー:", err);
        const errorMessage = err instanceof Error ? err.message : "認証に失敗しました";
        setError(errorMessage);
        
        // エラーが発生した場合はログインページにリダイレクト
        setTimeout(() => {
          router.push("/login");
        }, 5000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [router, setUser, createUserAfterVerification]);

  return (
    <div className={styles.callback_container}>
      {error ? (
        <div className={styles.error_message}>
          <h2>エラーが発生しました</h2>
          <p>{error}</p>
          <p>5秒後にログインページにリダイレクトします...</p>
        </div>
      ) : (
        <div className={styles.loading_message}>
          <div className={styles.spinner}></div>
        </div>
      )}
    </div>
  );
} 