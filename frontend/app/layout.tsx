import { Noto_Sans_JP, Roboto, Tsukimi_Rounded } from "next/font/google";
import "@/app/styles/globals.scss";
import QueryProvider from "./providers/QueryProvider";
import LoadingProvider from "./providers/LoadingProvider";
import type { Metadata } from "next";
import Container from "@/app/components/layout/Container/Container";
import { Toaster } from 'react-hot-toast';

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  preload: true,
  variable: "--font-noto-sans-jp",
  display: "swap",
  fallback: ["sans-serif"],
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "700"],
  preload: true,
  variable: "--font-roboto",
  display: "swap",
  fallback: ["Arial", "Helvetica", "sans-serif"],
});

const tsukimiRounded = Tsukimi_Rounded({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  preload: false,
  variable: "--font-tsukimi-rounded",
  display: "swap",
  fallback: ["Arial", "Helvetica", "sans-serif"],
});

export const metadata: Metadata = {
  title: {
    default: "あまりもの",
    template: "%s | あまりもの"
  },
  description: "あまりもので簡単レシピを作ろう！家にある材料で美味しい料理を作るためのレシピ管理システムです。",
  keywords: ["レシピ", "料理", "あまりもの", "食材", "クッキング", "料理レシピ"],
  authors: [{ name: "あまりもの" }],
  creator: "あまりもの",
  publisher: "あまりもの",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://amarimono.okamura.dev'),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      {
        url: '/icon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        url: '/icon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
  openGraph: {
    title: "あまりもの",
    description: "あまりもので簡単レシピを作ろう！家にある材料で美味しい料理を作るためのレシピ管理システムです。",
    url: 'https://amarimono.okamura.dev',
    siteName: 'あまりもの',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'あまりもの - レシピ管理システム',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "あまりもの",
    description: "あまりもので簡単レシピを作ろう！家にある材料で美味しい料理を作るためのレシピ管理システムです。",
    images: ['/images/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ja"
      className={`${notoSansJp.variable} ${roboto.variable} ${tsukimiRounded.variable}`}
      suppressHydrationWarning
    >
      <head />
      <body>
        <QueryProvider>
          <LoadingProvider>
            <Container>{children}</Container>
          </LoadingProvider>
        </QueryProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
