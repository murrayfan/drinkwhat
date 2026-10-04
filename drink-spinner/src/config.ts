/** 網站維護者聯絡信箱（權利人通知、問題回報），在 .env 設定 VITE_CONTACT_EMAIL */
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL?.trim() ?? ''

if (import.meta.env.DEV && !CONTACT_EMAIL) {
  console.warn('[config] 尚未設定 VITE_CONTACT_EMAIL，免責聲明頁的聯絡方式會顯示為待補')
}
