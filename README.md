# WordVault PWA — 安裝與設定說明

## 檔案結構
```
wordvault-pwa/
├── index.html       ← 主程式（含全部功能）
├── manifest.json    ← PWA 安裝設定
├── sw.js            ← Service Worker（離線快取）
├── icon-192.png     ← App 圖示
├── icon-512.png     ← App 圖示（大）
└── README.md        ← 本說明
```

---

## 第一步：設定 Firebase（免費，用於跨裝置同步）

### 1. 建立 Firebase 專案
1. 前往 https://console.firebase.google.com
2. 點「新增專案」→ 輸入專案名稱（例如 wordvault）→ 繼續
3. 關閉 Google Analytics（可選）→ 建立專案

### 2. 加入 Web 應用程式
1. 專案主頁 → 點「</>」Web 圖示
2. 輸入 App 名稱 → 點「註冊應用程式」
3. 複製 `firebaseConfig` 物件（像這樣）：
```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```
4. 打開 `index.html`，找到「請在這裡填入你的 Firebase 設定」那段，貼上你的設定

### 3. 開啟 Google 登入
1. Firebase Console → 左側「Authentication」→「Sign-in method」
2. 點「Google」→ 啟用 → 填入你的 Email → 儲存

### 4. 建立 Firestore 資料庫
1. Firebase Console → 左側「Firestore Database」→「建立資料庫」
2. 選「以正式模式啟動」→ 選地區（asia-east1 最快）→ 完成
3. 點「規則」分頁，貼上以下規則（只允許登入的使用者讀寫自己的資料）：
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/app/{doc} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
4. 點「發布」

---

## 第二步：部署（讓手機也能安裝）

PWA 必須透過 HTTPS 才能安裝，有幾種免費選擇：

### 選項 A：GitHub Pages（最簡單，免費）
1. 到 https://github.com 建立新 repository（名稱例如 wordvault）
2. 上傳所有檔案
3. Settings → Pages → Branch: main → 儲存
4. 幾分鐘後可在 `https://你的帳號.github.io/wordvault/` 使用

### 選項 B：Netlify（拖曳上傳，最快）
1. 到 https://netlify.com 註冊（免費）
2. 把整個 wordvault-pwa 資料夾拖曳到 Netlify 的 Deploy 區域
3. 幾秒後自動取得 https 網址

### 選項 C：Firebase Hosting（整合最好）
```bash
npm install -g firebase-tools
firebase login
firebase init hosting    # 選你的專案，public 目錄填 .
firebase deploy
```

---

## 第三步：安裝到手機主畫面

### Android（Chrome）
- 開啟網址 → 點右上角「⋮」→「加到主畫面」

### iPhone（Safari）
- 開啟網址 → 點底部「分享」→「加入主畫面」
- 注意：iPhone 必須用 Safari，Chrome 不支援安裝

---

## 常見問題

**Q：不設定 Firebase 能用嗎？**
A：可以！保留預設設定，App 會以「訪客模式」運作，資料存在本機，功能完整，只是無法跨裝置同步。

**Q：Firebase 免費額度夠用嗎？**
A：個人使用完全夠。免費額度：每天 50,000 次讀取、20,000 次寫入、1 GB 儲存。

**Q：資料安全嗎？**
A：Firestore 規則確保每個使用者只能讀寫自己的資料，其他人看不到你的學習內容。
