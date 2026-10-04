# 🧋 今天喝什麼？手搖飲轉盤

幫有選擇障礙的人決定今天喝哪家手搖飲。React 19 + TypeScript + Vite + React Router 7 + Tailwind CSS 4。

## 功能

- **GPS 模式**：定位後用 OpenStreetMap 找附近飲料店放進轉盤，結果顯示地圖、電話、營業時間與導航
- **不使用 GPS**：從品牌清單隨機挑 6 種，結果帶到 Google 地圖找最近分店
- **設定**：喜歡的品牌（只轉喜歡的／格子加倍）、不想喝的品牌或分店、搜尋範圍、轉盤格數、
  避免重複、只顯示營業中、轉動時間、音效、震動、恢復預設值
- **再轉一次**：直接開始轉動
- **免責聲明與常見問題**：`/about`

本站沒有後端，設定與紀錄只存在使用者瀏覽器的 localStorage。

## 文件

完整說明手冊在 [`docs/`](./docs/README.md)：

- [系統設計說明書](./docs/01-系統設計說明書.md)：架構、模組、資料模型、演算法、外部介接、測試策略
- [使用者操作手冊](./docs/02-使用者操作手冊.md)：畫面說明、操作步驟、設定項目、常見問題
- [建置與維運手冊](./docs/03-建置與維運手冊.md)：環境、部署、每月品牌更新 SOP、發布檢核表、故障排除

## 開發

```bash
pnpm install
pnpm run dev        # 開發伺服器 http://localhost:5173
pnpm test           # 單元與畫面測試（vitest + jsdom）
pnpm run lint
pnpm run build      # 型別檢查 + 正式建置到 dist/
```

GPS 只能在 `localhost` 或 HTTPS 下使用。

### 聯絡信箱

免責聲明頁會顯示權利人聯絡信箱，複製 `.env.example` 為 `.env.local` 後填入 `VITE_CONTACT_EMAIL`。

## 預設品牌清單（每月更新）

`src/data/brands.json` 是依 OpenStreetMap 統計的全台分店數前 20 名（ODbL © OpenStreetMap contributors）。

```bash
pnpm run update-brands                    # 連 Overpass API 重新統計
pnpm run update-brands --input tw.json    # 用已下載的資料重算
```

檢查印出的表格合理後再提交。若某品牌店數明顯偏低，通常是店名寫法沒對到，
在 `scripts/update-brands.mjs` 的 `ALIASES` 補上關鍵字。檔案不存在或格式錯誤時，App 會退回內建清單。

## 目錄

```
src/
  pages/        Home（轉盤）、Settings、About
  components/   Wheel、SpinBoard、ResultCard、HistoryList、BrandIcon
  hooks/        useNearbyShops、useSettings、useHistory
  lib/          brands（品牌清單與比對）、choices（轉盤規則）、wheel（角度與落點）、
                openingHours、overpass、storage、feedback（音效與震動）
  data/         brands.json
scripts/        update-brands.mjs
```
