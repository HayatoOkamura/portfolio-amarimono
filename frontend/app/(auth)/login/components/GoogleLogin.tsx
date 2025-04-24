"use client";

import { supabase } from "@/app/lib/api/supabase/supabaseClient";
import { FcGoogle } from "react-icons/fc";
import styles from "./GoogleLogin.module.scss";

export default function GoogleLogin() {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    });
    if (error) {
      alert(error.message);
    }
  };

  return (
    <button onClick={handleGoogleLogin} className={styles.google_block}>
      <FcGoogle className={styles.google_block__icon} />
      Googleでログイン
    </button>
  );
} 