import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "臻品齋藏書資料庫",
  description: "百萬冊實體中文語料的盤點、去重、非破壞掃描、OCR、校對與AI訓練資料格式化合作。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
