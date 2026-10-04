export interface Coords {
  lat: number
  lon: number
}

/** GPS 模式：附近的實際店家 */
export interface Shop extends Coords {
  kind: 'shop'
  id: string
  name: string
  address?: string
  phone?: string
  openingHours?: string
  /** 與使用者的距離（公尺） */
  distance: number
}

/** 不使用 GPS 模式：只有品牌，沒有特定分店 */
export interface Brand {
  kind: 'brand'
  id: string
  name: string
}

export type Choice = Shop | Brand

/** 轉盤上的一格；weight 越大格子越大 */
export interface WheelEntry {
  choice: Choice
  weight: number
  favorite: boolean
}

export interface ExcludedShop {
  id: string
  name: string
}

export type FavoriteMode = 'filter' | 'weight'

export interface AppSettings {
  useGps: boolean
  favoriteBrands: string[]
  /** filter：只轉喜愛品牌；weight：喜愛品牌格子加大 */
  favoriteMode: FavoriteMode
  excludedBrands: string[]
  excludedShops: ExcludedShop[]
  /** 搜尋半徑（公尺） */
  radius: number
  /** GPS 模式的轉盤格數 */
  wheelSize: number
  /** 最近 N 次轉到的不再出現，0 = 關閉 */
  avoidRepeat: number
  onlyOpen: boolean
  spinSeconds: number
  sound: boolean
  vibration: boolean
}

export interface HistoryEntry {
  kind: Choice['kind']
  id: string
  name: string
  at: number
}
