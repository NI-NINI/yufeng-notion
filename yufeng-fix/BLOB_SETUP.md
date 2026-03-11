# 附件上傳功能 — Vercel Blob 設定步驟

## 1. 在 Vercel 建立 Blob Store

1. 打開 vercel.com → 你的專案 (yufeng-notion)
2. 上方選單 → **Storage**
3. 點 **Create Database** → 選 **Blob**
4. 名稱輸入 `yufeng-files`，按 **Create**

## 2. 取得並設定環境變數

建立後，Vercel 會顯示一個環境變數：
```
BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxx...
```

到 Settings → Environment Variables → 加入這個變數（Production + Preview + Development 都勾）。

## 3. 重新 Deploy

設定完環境變數後，回到 Deployments → 最新一筆右側 ⋯ → **Redeploy**。

---

## 功能說明

- 在案件 detail panel 最下方有「附件」區塊
- 支援 **PDF**（合約、報價單）和 **圖片**（PNG/JPG/HEIC 等）
- 上傳後自動寫入對應的 **Notion 案件頁面 body**，在 Notion 也看得到
- 點檔名可直接開新視窗預覽
- 按 ✕ 可從 Notion 頁面移除附件

## 注意

- Vercel Blob 免費方案：5GB 儲存、100GB 流量/月，對事務所日常使用綽綽有餘
- 附件 URL 為公開連結（有長串 token 保護，非常難猜），若需要更嚴格的私密保護可改用 Supabase Storage
