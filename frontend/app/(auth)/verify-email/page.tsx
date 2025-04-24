"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/api/supabase/supabaseClient";
import styles from "./VerifyEmail.module.scss";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);

  useEffect(() => {
    const getEmail = async () => {
      try {
        // 1. まずセッションからメールアドレスを取得
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.email) {
          setEmail(session.user.email);
          return;
        }

        // 2. セッションにない場合はURLパラメータを確認
        const urlParams = new URLSearchParams(window.location.search);
        const emailFromUrl = urlParams.get('email');
        
        if (emailFromUrl) {
          setEmail(emailFromUrl);
        } else {
          // 3. どちらも取得できない場合はログインページにリダイレクト
          router.push("/login");
        }
      } catch (error) {
        console.error("Error getting email:", error);
        setError("メールアドレスの取得に失敗しました");
      }
    };

    getEmail();

    // 定期的に認証状態を確認
    const interval = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user?.email_confirmed_at) {
          setIsVerified(true);
          setSuccess("メール認証が完了しています");
          // 認証完了後、プロフィール設定ページにリダイレクト
          router.push("/user/edit?setup=true");
        }
      } catch (error) {
        console.error("Verification check error:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  const handleResendVerification = async () => {
    try {
      console.log("Starting resend verification process...");
      console.log("Current email state:", email);
      
      if (!email) {
        console.error("No email address available");
        setError("メールアドレスが見つかりません");
        return;
      }

      setIsResending(true);
      setError(null);
      setSuccess(null);

      // メールアドレスの形式をチェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError("メールアドレスの形式が正しくありません");
        return;
      }

      console.log("Calling supabase.auth.resend with:", {
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/callback`,
        }
      });

      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/callback`,
        },
      });

      console.log("Supabase response:", { data, error });

      if (error) {
        console.error("Supabase resend error:", error);
        if (error.message.includes("rate limit")) {
          setError("送信制限に達しました。しばらく待ってから再度お試しください");
        } else if (error.message.includes("email")) {
          setError("メールアドレスが無効です");
        } else if (error.message.includes("already confirmed")) {
          setError("このメールアドレスは既に認証済みです");
        } else {
          setError(`確認メールの再送信に失敗しました: ${error.message}`);
        }
        return;
      }

      console.log("Verification email resent successfully");
      setSuccess("確認メールを再送信しました");
    } catch (error) {
      console.error("Unexpected error in resend process:", error);
      setError("予期せぬエラーが発生しました");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className={styles.verify_block}>
      <div className={styles.verify_block__inner}>
        <h1 className={styles.verify_block__title}>メール認証</h1>
        <div className={styles.verify_block__content}>
          {email && (
            <p className={styles.verify_block__email}>
              {email}
            </p>
          )}
          <p className={styles.verify_block__text}>
            上記のメールアドレスに確認メールを送信しました。<br />
            メール内のリンクをクリックして認証を完了してください。
          </p>
          {error && <p className={styles.verify_block__error}>{error}</p>}
          {success && <p className={styles.verify_block__success}>{success}</p>}
          <button
            className={styles.verify_block__button}
            onClick={handleResendVerification}
            disabled={isResending}
          >
            {isResending ? "再送信中..." : "確認メールを再送信"}
          </button>
        </div>
      </div>
    </div>
  );
} 