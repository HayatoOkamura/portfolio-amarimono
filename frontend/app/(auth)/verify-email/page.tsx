"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/app/lib/api/supabase/supabaseClient";
import Loading from "@/app/components/ui/Loading/Loading";
import styles from "./VerifyEmail.module.scss";
import { useUserStore } from "@/app/stores/userStore";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string>("");
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { setUser } = useUserStore();

  useEffect(() => {
    const getEmail = async () => {
      try {
        // 1. まずURLパラメータからメールアドレスを取得
        const emailFromUrl = searchParams.get('email');
        if (emailFromUrl) {
          setEmail(emailFromUrl);
          setIsLoading(false);
          return;
        }

        // 2. URLパラメータにない場合はセッションから取得
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          setEmail(session.user.email);
          setIsLoading(false);
          return;
        }

        // 3. どちらも取得できない場合はログインページにリダイレクト
        router.push("/login");
      } catch (error) {
        console.error("メールアドレス取得エラー:", error);
        setError("メールアドレスの取得に失敗しました");
        setIsLoading(false);
      }
    };

    getEmail();

    // 定期的に認証状態を確認
    const interval = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user?.email_confirmed_at) {
          // メール認証が完了した場合、ユーザー情報をストアに保存
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            email_confirmed_at: session.user.email_confirmed_at,
            created_at: session.user.created_at,
            updated_at: session.user.updated_at
          });

          setIsVerified(true);
          setSuccess("メール認証が完了しました。TOPページに移動します。");
          
          // 認証完了後、TOPページにリダイレクト
          setTimeout(() => {
            router.push("/");
          }, 2000);
        }
      } catch (error) {
        console.error("認証状態確認エラー:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [router, searchParams, setUser]);

  // クールダウンタイマーの処理
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleResendVerification = async () => {
    try {
      if (cooldown > 0) {
        setError(`再送信は${cooldown}秒後に可能です`);
        return;
      }
      
      if (!email) {
        console.error("メールアドレスが取得できません");
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

      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_SITE_URL 
            ? `${process.env.NEXT_PUBLIC_SITE_URL}/callback`
            : 'https://amarimono.okamura.dev/callback',
        },
      });

      if (error) {
        if (error.message.includes("rate limit")) {
          setError("送信制限に達しました。しばらく待ってから再度お試しください");
        } else if (error.message.includes("email")) {
          setError("メールアドレスが無効です");
        } else if (error.message.includes("already confirmed")) {
          setError("このメールアドレスは既に認証済みです");
        } else if (error.message.includes("36 seconds")) {
          setError("再送信は36秒後に可能です");
          setCooldown(36);
        } else {
          setError(`確認メールの再送信に失敗しました: ${error.message}`);
        }
        return;
      }

      setSuccess("確認メールを再送信しました");
      setCooldown(36);
    } catch (error) {
      console.error("予期せぬエラーが発生しました:", error);
      setError("予期せぬエラーが発生しました");
    } finally {
      setIsResending(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.verify_block}>
        <Loading />
      </div>
    );
  }

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
            disabled={isResending || cooldown > 0}
          >
            {isResending ? "再送信中..." : cooldown > 0 ? `再送信可能まで${cooldown}秒` : "確認メールを再送信"}
          </button>
        </div>
      </div>
    </div>
  );
} 