"use client";

import { Noto_Sans_JP } from "next/font/google";
import "@/styles/globals.scss";
import Container from "./components/layout/Container/Container";
import { useEffect } from "react";
import { supabase } from "@/app/lib/api/supabase/supabaseClient";
import { useUserStore } from "@/app/stores/userStore";

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "700"],
  preload: false,
  variable: "--font-noto-sans-jp",
  display: "swap",
  fallback: ["Hiragino Sans", "Hiragino Kaku Gothic ProN", "sans-serif"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { setUser } = useUserStore();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUser(user);
    };

    fetchUser();
  }, [setUser]);

  return (
    <html lang="ja" className={notoSansJp.variable} suppressHydrationWarning>
      <head />
      <body>
        <Container>{children}</Container>
      </body>
    </html>
  );
}
