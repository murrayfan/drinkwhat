import { describe, expect, it } from 'vitest'
import { buildBrandWheel, buildShopWheel, matchesBrand, pickRandomBrands } from './choices'
import { RANKED_BRAND_NAMES } from './brands'
import { history, settings, shop } from '../test/fixtures'

const shops = [
  shop('1', '50嵐 A店', 100),
  shop('2', '50嵐 A店', 120), // 同名分店，只留最近的
  shop('3', '可不可熟成紅茶', 200, { openingHours: '01:00-01:01' }),
  shop('4', '迷客夏', 300),
  shop('5', '清心福全', 400),
  shop('6', 'MACU TEA', 500),
]
const names = (s: Parameters<typeof buildShopWheel>[1], h = history()) =>
  buildShopWheel(shops, s, h).entries.map((e) => `${e.choice.name}${e.weight > 1 ? '×2' : ''}`)

describe('matchesBrand', () => {
  it('排行品牌用所有關鍵字比對，不分大小寫', () => {
    expect(matchesBrand('macu tea 信義店', ['麻古茶坊'])).toBe(true)
    expect(matchesBrand('五十嵐', ['50嵐'])).toBe(true)
    expect(matchesBrand('迷客夏', ['50嵐'])).toBe(false)
  })
})

describe('buildShopWheel', () => {
  it('預設：依距離、同名只留一間', () => {
    expect(names(settings())).toEqual(['50嵐 A店', '可不可熟成紅茶', '迷客夏', '清心福全', 'MACU TEA'])
  })

  it('排除單一分店：同名的重複登錄也一起排除', () => {
    expect(names(settings({ excludedShops: [{ id: '1', name: '50嵐 A店' }] }))).not.toContain('50嵐 A店')
  })

  it('排除品牌與單一分店', () => {
    expect(names(settings({ excludedBrands: ['50嵐'], excludedShops: [{ id: '4', name: '迷客夏' }] }))).toEqual([
      '可不可熟成紅茶', '清心福全', 'MACU TEA',
    ])
  })

  it('只顯示營業中：排除確定打烊的，沒資料的保留', () => {
    expect(names(settings({ onlyOpen: true }))).not.toContain('可不可熟成紅茶')
    expect(names(settings({ onlyOpen: true }))).toContain('迷客夏')
  })

  it('全部打烊時退回顯示全部並提示', () => {
    const closed = [shop('a', '甲', 1, { openingHours: '01:00-01:01' }), shop('b', '乙', 2, { openingHours: '01:00-01:01' })]
    const build = buildShopWheel(closed, settings({ onlyOpen: true }), [])
    expect(build.entries).toHaveLength(2)
    expect(build.notes[0]).toContain('休息')
  })

  it('只轉喜歡的（≥2 間）', () => {
    expect(names(settings({ favoriteBrands: ['麻古茶坊', '迷客夏'] }))).toEqual(['迷客夏', 'MACU TEA'])
  })

  it('只轉喜歡的但附近只有 1 間：混入其他店並加權', () => {
    const build = buildShopWheel(shops, settings({ favoriteBrands: ['麻古茶坊'] }), [])
    expect(build.entries[0]).toMatchObject({ favorite: true, weight: 2 })
    expect(build.entries.length).toBeGreaterThan(1)
    expect(build.notes[0]).toContain('只有 1 間')
  })

  it('附近沒有喜歡的：全部顯示並提示', () => {
    const build = buildShopWheel(shops, settings({ favoriteBrands: ['得正'] }), [])
    expect(build.entries).toHaveLength(5)
    expect(build.notes[0]).toContain('沒有你喜愛的品牌')
  })

  it('加權模式：喜歡的排前面、格子兩倍，並受格數限制', () => {
    expect(names(settings({ favoriteBrands: ['麻古茶坊'], favoriteMode: 'weight', wheelSize: 3 }))).toEqual([
      'MACU TEA×2', '50嵐 A店', '可不可熟成紅茶',
    ])
  })

  it('避免重複：跳過最近 N 次', () => {
    const h = history(['shop', '1', '50嵐 A店'], ['shop', '4', '迷客夏'])
    expect(names(settings({ avoidRepeat: 1 }), h)).not.toContain('50嵐 A店')
    expect(names(settings({ avoidRepeat: 1 }), h)).toContain('迷客夏')
    expect(names(settings({ avoidRepeat: 3 }), h)).not.toContain('迷客夏')
  })

  it('避免重複後少於 2 格就不過濾', () => {
    const two = [shop('1', '甲', 1), shop('2', '乙', 2)]
    const build = buildShopWheel(two, settings({ avoidRepeat: 1 }), history(['shop', '1', '甲']))
    expect(build.entries).toHaveLength(2)
    expect(build.notes[0]).toContain('最近喝過')
  })
})

describe('pickRandomBrands', () => {
  it('固定 6 種、不重複、都在排行裡', () => {
    for (let i = 0; i < 200; i++) {
      const brands = pickRandomBrands(settings(), [])
      expect(brands).toHaveLength(6)
      expect(new Set(brands).size).toBe(6)
      brands.forEach((b) => expect(RANKED_BRAND_NAMES).toContain(b))
    }
  })

  it('喜歡的一定入選、排除的不會出現、最近喝過的跳過', () => {
    const s = settings({ favoriteBrands: ['自訂小店'], excludedBrands: ['50嵐'], avoidRepeat: 1 })
    for (let i = 0; i < 200; i++) {
      const brands = pickRandomBrands(s, history(['brand', '迷客夏', '迷客夏']))
      expect(brands).toContain('自訂小店')
      expect(brands).not.toContain('50嵐')
      expect(brands).not.toContain('迷客夏')
    }
  })
})

describe('buildBrandWheel', () => {
  it('排除品牌即時生效、喜歡的混在其他品牌中時加權', () => {
    const build = buildBrandWheel(['50嵐', '迷客夏', '得正'], settings({ excludedBrands: ['得正'], favoriteBrands: ['50嵐'] }), [])
    expect(build.entries.map((e) => [e.choice.name, e.weight])).toEqual([['50嵐', 2], ['迷客夏', 1]])
    expect(build.entries[0].choice.kind).toBe('brand')
  })
})
