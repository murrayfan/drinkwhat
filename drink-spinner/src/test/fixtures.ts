import { DEFAULT_SETTINGS } from '../lib/storage'
import type { AppSettings, HistoryEntry, Shop } from '../types'

export const settings = (patch: Partial<AppSettings> = {}): AppSettings => ({
  ...DEFAULT_SETTINGS,
  sound: false,
  vibration: false,
  ...patch,
})

export const shop = (id: string, name: string, distance: number, patch: Partial<Shop> = {}): Shop => ({
  kind: 'shop',
  id,
  name,
  lat: 25.04,
  lon: 121.54,
  distance,
  ...patch,
})

export const history = (...items: [HistoryEntry['kind'], string, string][]): HistoryEntry[] =>
  items.map(([kind, id, name], i) => ({ kind, id, name, at: Date.now() - i * 60000 }))

/** 存設定到 localStorage，讓頁面載入時讀到 */
export const storeSettings = (patch: Partial<AppSettings>) =>
  localStorage.setItem('drink-spinner:settings', JSON.stringify(settings(patch)))
