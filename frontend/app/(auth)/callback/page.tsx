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
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setIsProcessing(true);

        // 1. セッションの取得
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw new Error(`セッションの取得に失敗しました: ${sessionError.message}`);
        }

        if (!session) {
          throw new Error("認証セッションが見つかりません");
        }

        // 2. ユーザー情報の取得
        const { data: { user }, error: userError } = await supabase.auth.getUser();

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

        // 4. バックエンドにユーザーを作成し、プロフィール設定ページにリダイレクト
        await createUserAfterVerification(user);

        // 5. プロフィール設定ページにリダイレクト
        router.push("/user/edit?setup=true");

      } catch (err) {
        console.error("認証エラー:", err);
        const errorMessage = err instanceof Error ? err.message : "認証に失敗しました";
        setError(errorMessage);
        setDebugInfo(JSON.stringify(err, null, 2));
        
        // エラーが発生した場合はログインページにリダイレクト
        setTimeout(() => {
          router.push("/login");
        }, 3000);
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
          <p>{error}</p>
          {debugInfo && (
            <details className={styles.debug_info}>
              <summary>詳細情報</summary>
              <pre>{debugInfo}</pre>
            </details>
          )}
          <p>ログインページにリダイレクトします...</p>
        </div>
      ) : (
        <div className={styles.loading_message}>
          <div className={styles.spinner}></div>
          <p>{isProcessing ? "認証中..." : "認証が完了しました。リダイレクト中..."}</p>
        </div>
      )}
    </div>
  );
} 