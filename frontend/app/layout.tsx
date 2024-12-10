"use client";

// import { ReactNode } from "react";
import "./globals.css";
import Main from "./Main";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head />
      <body className="min-h-screen bg-white md:bg-gray-400">
        <Main>{children}</Main>
      </body>
    </html>
  );
}
