# 西灣日記 Diary of Sizihwan

一個基於 React Native 的行動應用程式，用於管理和分享評論、用戶資料和互動，並配備 AI 驅動的問答系統，能夠根據用戶評論和位置數據提供智能回應。

<img src="https://github.com/user-attachments/assets/8503c3b8-714f-4ecd-b362-5701d3cd04c3" style="width: 160px;" />
<img src="https://github.com/user-attachments/assets/09f983e2-1f97-4076-892f-0e33f4489162" style="width: 160px;" />
<img src="https://github.com/user-attachments/assets/46e68bc4-f2bf-40c8-b4a5-ca4cb1cadef1" style="width: 160px;" />

## 功能特色

### AI 驅動的問答系統
- **提問功能**：詢問關於校園的問題並獲得 AI 生成的回應
- **智能搜尋**：搜尋現有評論以找到相關資訊
- **位置感知**：根據用戶位置提供情境相關的回應
- **多語言支援**：支援英文和繁體中文 (為國際生設計)
- **回應歷史**：查看過去的問題和回答
- **相關評論**：查看 AI 回應中引用的評論

### 評論管理
- **建立評論**：撰寫和發布新評論
- **編輯評論**：修改現有評論
- **瀏覽評論**：查看所有評論
- **最新評論**：查看最近的評論
- **我的評論**：存取和管理自己的評論

### 用戶功能
- **用戶資料**：建立和管理個人資料
- **個人照片**：上傳和更新個人照片
- **設定**：自訂應用程式體驗
- **關於**：了解更多應用程式資訊
- **聯絡支援**：需要時獲得協助

## 技術架構

- **前端**：React Native
- **導航**：React Navigation (Native Stack Navigator)
- **程式語言**：TypeScript
- **狀態管理**：React Context
- **儲存**：AsyncStorage
- **圖片處理**：Expo Image Picker & Manipulator
- **地圖**：React Native Maps
- **API 整合**：具備嵌入和向量搜尋功能的 RESTful API

## 專案結構

應用程式採用基於畫面的結構，主要元件如下：

- `src/screens/Main.tsx`：主要導航設定
- `src/screens/Main/`：包含所有主要畫面元件
  - `Home.tsx`：整合地圖的主頁面
  - `Ask.tsx`：AI 驅動的問答介面
  - `Profile.tsx`：用戶資料管理
  - `New.tsx`：建立新評論
  - `Reviews.tsx`：瀏覽評論
  - `Latest.tsx`：查看最新評論
  - `UserProfile.tsx`：查看其他用戶資料
  - `ProfileOptions/`：額外的個人資料功能
    - `MyReviews.tsx`：用戶的評論
    - `EditReview.tsx`：編輯現有評論
    - `Settings.tsx`：應用程式設定
    - `AskHistory.tsx`：問答歷史
    - `AskHistoryView.tsx`：查看過去的問答
    - `About.tsx`：應用程式資訊
    - `ContactUs.tsx`：支援聯絡

## 開始使用

### 必要條件

- Node.js
- npm 或 yarn
- React Native 開發環境設定
- iOS/Android 開發環境
- Expo CLI

### 安裝步驟

1. 複製專案：
```bash
git clone [repository-url]
```

2. 安裝依賴：
```bash
npm install
# 或
yarn install
```

3. 啟動開發伺服器：
```bash
npm start
# 或
yarn start
```

4. 在 iOS 上運行：
```bash
npm run ios
# 或
yarn ios
```

5. 在 Android 上運行：
```bash
npm run android
# 或
yarn android
```

## 主要功能詳情

### AI 問答系統
應用程式使用先進的 AI 系統：
- 將問題翻譯成英文以獲得更好的處理效果
- 使用向量嵌入來尋找相關評論
- 考慮用戶位置以提供情境相關的回應
- 提供逐字元動畫回應
- 維護所有問答互動的歷史記錄
- 顯示 AI 回應中引用的評論

### 評論系統
評論系統包含：
- 基於位置的評論建立
- 評論編輯功能
- 基於分數的評論相關性
- 用戶歸屬
- 時間戳記追蹤
- 多語言支援

### 使用者介面
應用程式特色：
- 特定畫面的模態呈現
- iOS 的底部滑入動畫
- 特定畫面的翻轉動畫
- iOS 和 Android 的響應式設計
- 鍵盤感知佈局
- 載入狀態和動畫

## 貢獻

1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 授權

本專案採用 MIT 授權條款 - 詳見 LICENSE 檔案。 
