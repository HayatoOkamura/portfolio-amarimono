/* eslint-disable */
"use client";

import { Noto_Sans_JP, Roboto } from "next/font/google";
import "@/styles/globals.scss";
import Container from "./components/layout/Container/Container";
import { useEffect } from "react";
import { useUserStore } from "@/app/stores/userStore";
import QueryProvider from "./providers/QueryProvider";

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "700"],
  preload: false,
  variable: "--font-noto-sans-jp",
  display: "swap",
  fallback: ["Hiragino Sans", "Hiragino Kaku Gothic ProN", "sans-serif"],
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "700"],
  preload: false,
  variable: "--font-roboto",
  display: "swap",
  fallback: ["Arial", "Helvetica", "sans-serif"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { setUser, fetchUser } = useUserStore();

  useEffect(() => {
    console.log("ユーザー取得");
    fetchUser();
  }, [setUser]);

  return (
    <html
      lang="ja"
      className={`${notoSansJp.variable} ${roboto.variable}`}
      suppressHydrationWarning
    >
      <head />
      <body>
        <QueryProvider>
          <Container>{children}</Container>
        </QueryProvider>
      </body>
    </html>
  );
}
