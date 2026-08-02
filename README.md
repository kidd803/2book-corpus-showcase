# 2BOOK 百萬藏書公開索引

臻品齋書店（2BOOK）的實體中文語料與數位化合作展示網站。

網站功能包括：

- 百萬冊實體藏書計畫與 16 個貨櫃的保存規模
- 10 萬筆 2book.tw 官網書目搜尋與商品連結
- 百萬藏書索引的前 100 頁，共 10 萬筆公開紀錄
- 非破壞性掃描、OCR、校對及 AI 訓練格式交付方法
- 中英文合作說明與聯絡表單

## 安全版資料範圍

這個 GitHub 專案只保存網站程式、樣式、Logo 與建置設定。書目 JSON、靜態書目索引、完整 SQLite 書庫、MySQL 原始資料、資料復原工具、內部庫位和執行紀錄全部排除，資料只留存在受控的本機環境。

本機預覽若要啟用書目搜尋或百萬索引，需要由資料管理者另行放入對應的本機資料檔；這些檔案不應提交至 GitHub。

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
