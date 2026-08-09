# 2BOOK 百萬藏書公開索引

臻品齋書店（2BOOK）的實體中文語料與數位化合作展示網站。

網站功能包括：

- 百萬冊實體藏書計畫與 16 個貨櫃的保存規模
- 91,756 筆 2book.tw 後台已發布、未刪除且網址不重複的商品搜尋與連結
- 百萬藏書索引的前 100 頁，共 10 萬筆公開紀錄
- 非破壞性掃描、OCR、校對及 AI 訓練格式交付方法
- 中英文合作說明與聯絡表單

## 公開資料範圍

這個 GitHub 專案包含網站程式、樣式、Logo、建置設定，以及兩組確認可公開的資料：`public/official-search.json` 的 91,756 筆 2book.tw 後台已發布、未刪除且網址不重複的商品，與 `public/archive/` 的前 100 頁靜態索引。

完整 SQLite 書庫、MySQL 原始資料、資料復原工具、內部庫位、執行紀錄和第 101 頁以後的索引仍全部排除，只留存在受控的本機環境。

## 本機執行

需要 Node.js 22.13 或更新版本。

```bash
pnpm install
pnpm dev
```

正式建置：

```bash
pnpm build
```

## 品牌與聯絡

- 官網：[2book.tw](https://2book.tw)
- 內容平台：[2books.com.tw](https://2books.com.tw)
- 合作信箱：baby.bt@gmail.com

Copyright © 臻品齋書店 / 2BOOK
