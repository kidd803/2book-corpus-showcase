import type { Metadata } from "next";
import CatalogBrowser from "./catalog-browser";

export const metadata: Metadata = {
  title: "實體中文語料供應與數位化執行中心 | 2BOOK",
  description: "臻品齋集中保存並初步編目的百萬冊實體中文語料，提供盤點、去重、非破壞掃描、OCR、校對與AI訓練資料格式化合作。",
};

export default function Home() {
  return <CatalogBrowser />;
}
