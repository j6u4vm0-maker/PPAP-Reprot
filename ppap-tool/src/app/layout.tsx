import type { Metadata } from "next";
import React from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "PPAP 尺寸球標與規格移轉工具",
  description: "實驗室量測前置作業系統 — PDF 圖紙球標標記、P3/P4 規格建檔與 JSON 移轉",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): React.ReactElement {
  return (
    <html lang="zh-Hant">
      <body className="antialiased">{children}</body>
    </html>
  );
}
