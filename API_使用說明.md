# 金鐘60 API 串接使用說明

## 📋 概述

已完成金鐘60應援海報功能的API串接，包含圖片生成、儲存、歷史記錄查詢等功能。

## 🔧 API 端點設定

API 端點已設定為：`https://stg-line-crm.fanpokka.ai/api`

### 配置檔案
- `api-config.js` - 主要API配置檔案
- `resources/js/config/config.js` - 配置管理模組
- `index.html` - 全局配置覆蓋

## 📡 API 功能

### Event Type 事件類型說明
API 支援兩種事件類型：
- `cheer` - 應援活動（本專案使用）
- `award_speech` - 頒獎致詞

### 1. 獲取用戶生成圖片數量及剩餘次數
- **端點**: `GET /gba60/images/count`
- **參數**: 
  - `user_id` (必填)
  - `event_type` (必填) - 支援: `cheer`, `award_speech`
- **功能**: 載入用戶當前生成次數和剩餘可用次數

### 2. 儲存用戶生成的圖片及資料
- **端點**: `POST /gba60/images`
- **參數**:
  - `user_id` (必填)
  - `event_type` (必填) - 支援: `cheer`, `award_speech`
  - `text` (必填) - 應援文字
  - `image` (必填) - 圖片檔案
- **功能**: 將用戶創建的應援海報儲存到後端

### 3. 獲取用戶生成圖片歷史紀錄
- **端點**: `GET /gba60/images`
- **參數**:
  - `user_id` (必填)
  - `event_type` (必填) - 支援: `cheer`, `award_speech`
- **功能**: 獲取用戶所有生成的應援海報歷史

### 4. 查看單張圖片詳情
- **端點**: `GET /gba60/images/{id}`
- **參數**:
  - `id` (路徑參數，必填)
  - `user_id` (查詢參數，可選)
- **功能**: 獲取特定圖片的詳細資訊

## 🎯 元件功能

### PosterCreation.vue
- ✅ 載入用戶生成次數和限制
- ✅ 創建應援海報時自動儲存到後端
- ✅ 即時更新剩餘生成次數
- ✅ 錯誤處理和使用者回饋
- ✅ 下載功能（本地Canvas生成）

### GenerationRecords.vue
- ✅ 自動載入用戶歷史記錄
- ✅ 支援錯誤處理和重新載入
- ✅ 獲取圖片詳細資訊
- ✅ 載入狀態和空狀態處理

## 🔄 API 服務功能

### apiService.js
- ✅ HTTP請求封裝（支援 GET/POST）
- ✅ 錯誤處理和狀態碼管理
- ✅ FormData 上傳支援
- ✅ Canvas 圖片處理和轉換
- ✅ 用戶身份驗證（透過LIFF）
- ✅ 調試模式支援

## 🚀 使用方式

### 開發環境
1. 確保 `api-config.js` 檔案存在
2. 在瀏覽器 console 檢查配置是否正確載入
3. 調試模式會顯示詳細的API呼叫記錄

### 生產環境
1. 修改 `api-config.js` 中的 `debug: false`
2. 確保 API 端點可正常存取
3. 驗證 LIFF 功能正常運作

## 🛠️ 錯誤處理

- **網路錯誤**: 自動顯示錯誤訊息，用戶可重試
- **API錯誤**: 根據HTTP狀態碼顯示對應錯誤訊息
- **LIFF錯誤**: 在非LINE環境下會顯示提示訊息
- **檔案上傳錯誤**: 自動重試機制

## 📝 調試資訊

在瀏覽器 Console 中可看到：
- 🔧 API 配置載入狀態
- 📡 API 端點資訊
- 🌐 API 請求和回應記錄
- ✅/❌ 功能執行結果

## 🔒 安全性

- 使用 LIFF SDK 獲取用戶身份
- 所有 API 請求都包含用戶驗證
- 支援 CORS 和安全標頭設定
- 敏感資訊不會記錄在 console

## 📱 行動裝置支援

- 完全支援 LINE 內建瀏覽器
- 響應式設計適配各種螢幕尺寸  
- 觸控操作優化
- 圖片處理針對行動裝置優化
