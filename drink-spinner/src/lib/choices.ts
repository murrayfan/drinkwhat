import { isOpenNow } from './openingHours'
import { RANDOM_BRAND_COUNT } from './storage'
import { RANKED_BRAND_NAMES, brandKeywords } from './brands'
import type { AppSettings, Brand, HistoryEntry, Shop, WheelEntry } from '../types'

export interface WheelBuild {
  entries: WheelEntry[]
  /** 給使用者看的提示，例如退回顯示全部的原因 */
  notes: string[]
}

const FAVORITE_WEIGHT = 2

/** 名稱是否屬於任一品牌（排行品牌會用它的所有關鍵字比對） */
export const matchesBrand = (name: string, brands: string[]) =>
  brands.some((b) => brandKeywords(b).some((k) => name.toLowerCase().includes(k.toLowerCase())))

const shuffle = <T>(arr: T[]) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const toEntries = <T extends Shop | Brand>(choices: T[], s: AppSettings): WheelEntry[] => {
  // 「只轉喜歡的」模式下若混入其他店（喜歡的不夠），喜歡的也要加權
  const mixed = choices.some((c) => !matchesBrand(c.name, s.favoriteBrands))
  const weighted = s.favoriteMode === 'weight' || mixed
  return choices.map((choice) => {
    const favorite = matchesBrand(choice.name, s.favoriteBrands)
    return { choice, favorite, weight: favorite && weighted ? FAVORITE_WEIGHT : 1 }
  })
}

/** 最近喝過的過濾：過濾後少於 2 格就不過濾，避免轉盤沒得轉 */
function withoutRecent<T>(pool: T[], isRecent: (item: T) => boolean, notes: string[]) {
  const fresh = pool.filter((item) => !isRecent(item))
  if (fresh.length === pool.length) return pool
  if (fresh.length >= 2) return fresh
  notes.push('可以選的店有點少，最近喝過的也一起放進來囉')
  return pool
}

/** GPS 模式：附近店家（已依距離排序）→ 轉盤 */
export function buildShopWheel(shops: Shop[], s: AppSettings, history: HistoryEntry[]): WheelBuild {
  const notes: string[] = []
  // 地圖上同一間店可能登錄成多筆（同名不同 id），所以 id 或店名相同都算同一間
  const isSameShop = (list: { id: string; name: string }[]) => (shop: Shop) =>
    list.some((x) => x.id === shop.id || x.name === shop.name)
  const isExcluded = isSameShop(s.excludedShops)
  let pool = shops.filter((shop) => !isExcluded(shop) && !matchesBrand(shop.name, s.excludedBrands))

  if (s.onlyOpen) {
    // 沒有營業時間資料的店（null）保留，只排除確定打烊的
    const open = pool.filter((shop) => isOpenNow(shop.openingHours) !== false)
    if (open.length) pool = open
    else notes.push('附近的店好像都休息了，先全部列出來給你參考')
  }

  if (s.favoriteBrands.length) {
    const favorites = pool.filter((shop) => matchesBrand(shop.name, s.favoriteBrands))
    const favoriteNames = new Set(favorites.map((shop) => shop.name))
    if (s.favoriteMode === 'filter' && favoriteNames.size >= 2) {
      pool = favorites
    } else {
      if (s.favoriteMode === 'filter') {
        notes.push(
          favorites.length
            ? '附近喜歡的品牌只有 1 間，加入其他店一起轉（喜歡的格子比較大）'
            : '附近沒有你喜愛的品牌，先轉轉看其他家吧',
        )
      }
      // 加權模式：喜愛品牌優先放進轉盤，其餘依距離
      pool = [...favorites, ...pool.filter((shop) => !favorites.includes(shop))]
    }
  }

  if (s.avoidRepeat > 0) {
    const recent = history.slice(0, s.avoidRepeat).filter((h) => h.kind === 'shop')
    pool = withoutRecent(pool, isSameShop(recent), notes)
  }

  // 同名店家只保留一間（最近的那間）
  const seen = new Set<string>()
  const unique = pool.filter((shop) => (seen.has(shop.name) ? false : (seen.add(shop.name), true)))
  return { entries: toEntries(unique.slice(0, s.wheelSize), s), notes }
}

const recentBrandNames = (s: AppSettings, history: HistoryEntry[]) =>
  history.slice(0, s.avoidRepeat).map((h) => h.name)

/** 不使用 GPS：隨機挑 6 個品牌，優先從喜愛品牌挑，不足再從排行品牌補 */
export function pickRandomBrands(s: AppSettings, history: HistoryEntry[]): string[] {
  const recent = recentBrandNames(s, history)
  const allowed = (b: string) => !matchesBrand(b, s.excludedBrands)
  let favorites = s.favoriteBrands.filter(allowed)
  let fillers = RANKED_BRAND_NAMES.filter((b) => allowed(b) && !favorites.includes(b))

  const notRecent = (b: string) => !recent.some((name) => matchesBrand(name, [b]))
  if ([...favorites, ...fillers].filter(notRecent).length >= RANDOM_BRAND_COUNT) {
    favorites = favorites.filter(notRecent)
    fillers = fillers.filter(notRecent)
  }

  const picked = shuffle(favorites).slice(0, RANDOM_BRAND_COUNT)
  return shuffle([...picked, ...shuffle(fillers)].slice(0, RANDOM_BRAND_COUNT))
}

/** 不使用 GPS：品牌清單 → 轉盤（即時套用避免重複與排除） */
export function buildBrandWheel(brands: string[], s: AppSettings, history: HistoryEntry[]): WheelBuild {
  const notes: string[] = []
  let pool = brands.filter((b) => !matchesBrand(b, s.excludedBrands))
  if (s.avoidRepeat > 0) {
    const recent = recentBrandNames(s, history)
    pool = withoutRecent(pool, (b) => recent.some((name) => matchesBrand(name, [b])), notes)
  }
  const choices: Brand[] = pool.map((name) => ({ kind: 'brand', id: name, name }))
  return { entries: toEntries(choices, s), notes }
}
