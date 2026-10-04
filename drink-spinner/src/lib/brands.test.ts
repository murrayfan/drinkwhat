import { describe, expect, it } from 'vitest'
import { FALLBACK_CATALOG, brandOfShop, catalog, findBrand, normalizeBrandNames, parseCatalog } from './brands'
import data from '../data/brands.json'

describe('brands.json', () => {
  it('格式正確且被採用', () => {
    expect(parseCatalog(data)).not.toBeNull()
    expect(catalog.source).toContain('OpenStreetMap')
    expect(catalog.brands).toHaveLength(20)
  })

  it('名次 1..20 不重複、店數遞減', () => {
    expect(catalog.brands.map((b) => b.rank)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1))
    const stores = catalog.brands.map((b) => b.stores ?? 0)
    expect([...stores].sort((a, b) => b - a)).toEqual(stores)
    expect(new Set(catalog.brands.map((b) => b.name)).size).toBe(20)
  })

  it('一個關鍵字只屬於一個品牌（避免比對到錯的品牌）', () => {
    const all = catalog.brands.flatMap((b) => b.keywords.map((k) => k.toLowerCase()))
    expect(new Set(all).size).toBe(all.length)
  })
})

describe('parseCatalog', () => {
  it.each([
    ['null', null],
    ['沒有 brands', { source: 'x' }],
    ['品牌太少', { brands: FALLBACK_CATALOG.brands.slice(0, 3) }],
    ['缺 keywords', { brands: FALLBACK_CATALOG.brands.map((b) => ({ ...b, keywords: [] })) }],
  ])('%s → null（退回內建清單）', (_, raw) => {
    expect(parseCatalog(raw)).toBeNull()
  })

  it('依名次排序', () => {
    const shuffled = { brands: [...FALLBACK_CATALOG.brands].reverse() }
    expect(parseCatalog(shuffled)!.brands[0].rank).toBe(1)
  })
})

describe('品牌比對', () => {
  it.each([
    ['麻古', '麻古茶坊'],
    ['清心', '清心福全'],
    ['茶之魔手', '茶的魔手'],
    ['可不可熟成紅茶', '可不可'],
    ['春水堂人文茶館', '春水堂'],
  ])('findBrand(%s) → %s', (input, expected) => {
    expect(findBrand(input)?.name).toBe(expected)
  })

  it.each([
    ['五十嵐 公館店', '50嵐'],
    ['MACU TEA 麻古', '麻古茶坊'],
    ['Come Buy 台大店', 'COMEBUY'],
    ['清新福全冷飲站', '清心福全'],
    ['TP TEA 茶湯會', '茶湯會'],
    ['路邊咖啡', undefined],
  ])('brandOfShop(%s) → %s', (shopName, expected) => {
    expect(brandOfShop(shopName)?.name).toBe(expected)
  })

  it('舊設定轉成新名稱並去重，自訂品牌保留', () => {
    expect(normalizeBrandNames(['麻古', '麻古茶坊', ' 清心 ', '再睡5分鐘', ''])).toEqual(['麻古茶坊', '清心福全', '再睡5分鐘'])
  })
})
