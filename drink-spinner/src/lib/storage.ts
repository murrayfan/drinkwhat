import { normalizeBrandNames } from './brands'
import type { AppSettings, HistoryEntry } from '../types'

export const RADIUS_OPTIONS = [500, 1000, 2000, 3000]
export const WHEEL_SIZE_OPTIONS = [6, 8, 12]
export const AVOID_REPEAT_OPTIONS = [0, 1, 3, 5]
export const SPIN_SECONDS_OPTIONS = [
  { value: 2.5, label: '快快' },
  { value: 4, label: '剛好' },
  { value: 6, label: '慢慢來' },
]

/** 開發手冊：不使用 GPS 時隨機給 6 種飲料店 */
export const RANDOM_BRAND_COUNT = 6

const SETTINGS_KEY = 'drink-spinner:settings'
const HISTORY_KEY = 'drink-spinner:history'
const HISTORY_LIMIT = 30

export const DEFAULT_SETTINGS: AppSettings = {
  useGps: true,
  favoriteBrands: [],
  favoriteMode: 'filter',
  excludedBrands: [],
  excludedShops: [],
  radius: 1000,
  wheelSize: 12,
  avoidRepeat: 0,
  onlyOpen: false,
  spinSeconds: 4,
  sound: true,
  vibration: true,
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 無痕模式等情況可能無法寫入，忽略即可
  }
}

export function loadSettings(): AppSettings {
  const settings = { ...DEFAULT_SETTINGS, ...readJson<Partial<AppSettings>>(SETTINGS_KEY, {}) }
  return {
    ...settings,
    favoriteBrands: normalizeBrandNames(settings.favoriteBrands),
    excludedBrands: normalizeBrandNames(settings.excludedBrands),
  }
}

export function saveSettings(settings: AppSettings) {
  writeJson(SETTINGS_KEY, settings)
}

export function loadHistory(): HistoryEntry[] {
  return readJson<HistoryEntry[]>(HISTORY_KEY, [])
}

export function saveHistory(history: HistoryEntry[]) {
  writeJson(HISTORY_KEY, history.slice(0, HISTORY_LIMIT))
}
