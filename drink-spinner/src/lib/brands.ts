/**
 * 品牌清單：src/data/brands.json 由 `pnpm run update-brands` 從 OpenStreetMap 統計產生，
 * 檔案不存在或格式錯誤時退回內建清單。
 */
export interface RankedBrand {
  rank: number
  /** 顯示用的短名稱 */
  name: string
  fullName: string
  /** 用來比對地圖上店名的關鍵字 */
  keywords: string[]
  /** OpenStreetMap 上登錄的分店數 */
  stores?: number
}

export interface BrandCatalog {
  source: string | null
  sourceUrl: string | null
  license: string | null
  /** 排名依據，例如「全台分店數」 */
  rankLabel: string | null
  period: string | null
  updatedAt: string | null
  brands: RankedBrand[]
}

const FALLBACK_NAMES: [string, string[]][] = [
  ['50嵐', ['50嵐', '五十嵐']], ['可不可', ['可不可']], ['麻古茶坊', ['麻古']], ['迷客夏', ['迷客夏']],
  ['清心福全', ['清心']], ['珍煮丹', ['珍煮丹']], ['五桐號', ['五桐號']], ['再睡5分鐘', ['再睡5分鐘']],
  ['水巷茶弄', ['水巷茶弄']], ['得正', ['得正']], ['CoCo都可', ['CoCo', '都可']], ['一沐日', ['一沐日']],
]

export const FALLBACK_CATALOG: BrandCatalog = {
  source: null,
  sourceUrl: null,
  license: null,
  rankLabel: null,
  period: null,
  updatedAt: null,
  brands: FALLBACK_NAMES.map(([name, keywords], i) => ({ rank: i + 1, name, fullName: name, keywords })),
}

const isRankedBrand = (b: unknown): b is RankedBrand => {
  const x = b as RankedBrand
  return (
    typeof x?.rank === 'number' &&
    typeof x.name === 'string' && x.name.length > 0 &&
    typeof x.fullName === 'string' &&
    Array.isArray(x.keywords) && x.keywords.length > 0 && x.keywords.every((k) => typeof k === 'string' && k.length > 0)
  )
}

/** 檢查 brands.json 內容，不合格回傳 null */
export function parseCatalog(raw: unknown): BrandCatalog | null {
  const data = raw as Partial<BrandCatalog> | undefined
  if (!data || !Array.isArray(data.brands) || data.brands.length < 6 || !data.brands.every(isRankedBrand)) return null
  return {
    source: data.source ?? null,
    sourceUrl: data.sourceUrl ?? null,
    license: data.license ?? null,
    rankLabel: data.rankLabel ?? null,
    period: data.period ?? null,
    updatedAt: data.updatedAt ?? null,
    brands: [...data.brands].sort((a, b) => a.rank - b.rank),
  }
}

function loadCatalog(): BrandCatalog {
  // 用 glob 載入：檔案不存在時得到空物件而不是建置失敗
  const files = import.meta.glob<unknown>('../data/brands.json', { eager: true, import: 'default' })
  const parsed = parseCatalog(Object.values(files)[0])
  if (!parsed && import.meta.env.DEV) console.warn('[brands] brands.json 不存在或格式錯誤，改用內建清單')
  return parsed ?? FALLBACK_CATALOG
}

export const catalog = loadCatalog()
export const RANKED_BRAND_NAMES = catalog.brands.map((b) => b.name)

const lower = (s: string) => s.toLowerCase()

/** 依名稱或關鍵字找排行品牌（例如舊設定的「麻古」→「麻古茶坊」） */
export function findBrand(name: string): RankedBrand | undefined {
  const n = lower(name.trim())
  return catalog.brands.find(
    (b) => lower(b.name) === n || lower(b.fullName) === n || b.keywords.some((k) => lower(k) === n),
  )
}

/** 店名屬於哪個排行品牌 */
export function brandOfShop(shopName: string): RankedBrand | undefined {
  const n = lower(shopName)
  return catalog.brands.find((b) => b.keywords.some((k) => n.includes(lower(k))))
}

/** 使用者設定的品牌名稱 → 比對用關鍵字（自訂品牌就用名稱本身） */
export const brandKeywords = (name: string) => findBrand(name)?.keywords ?? [name]

/** 舊設定名稱轉成目前清單的名稱並去重 */
export const normalizeBrandNames = (names: string[]) => [
  ...new Set(names.map((n) => findBrand(n)?.name ?? n.trim()).filter(Boolean)),
]

/** 所有排行品牌的關鍵字，用來在地圖上找更多店 */
export const ALL_BRAND_KEYWORDS = catalog.brands.flatMap((b) => b.keywords)
