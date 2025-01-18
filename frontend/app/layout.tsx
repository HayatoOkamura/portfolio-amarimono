"use client";

import { Noto_Sans_JP } from "next/font/google";
import "@/styles/globals.scss";
import Container from './components/layout/Container/Container';

const notoSansJp = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '700'],
  preload: false,
  variable: '--font-noto-sans-jp',
  display: 'swap',
  fallback: ['Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'sans-serif'],
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={notoSansJp.variable} suppressHydrationWarning>
      <head />
      <body>
      <Container>{children}</Container>
      </body>
    </html>
  );
}
