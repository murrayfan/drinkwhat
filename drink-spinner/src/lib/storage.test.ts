import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, loadHistory, loadSettings, saveHistory, saveSettings } from './storage'

describe('settings', () => {
  it('沒有資料時用預設值', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('資料壞掉時用預設值，不會壞掉整頁', () => {
    localStorage.setItem('drink-spinner:settings', '{not json')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('舊版設定：補上新欄位並轉換品牌名稱', () => {
    localStorage.setItem('drink-spinner:settings', JSON.stringify({ favoriteBrands: ['麻古', '清心'], radius: 2000 }))
    const s = loadSettings()
    expect(s.favoriteBrands).toEqual(['麻古茶坊', '清心福全'])
    expect(s.radius).toBe(2000)
    expect(s.wheelSize).toBe(DEFAULT_SETTINGS.wheelSize)
  })

  it('存了再讀一樣', () => {
    const s = { ...DEFAULT_SETTINGS, useGps: false, favoriteBrands: ['50嵐'] }
    saveSettings(s)
    expect(loadSettings()).toEqual(s)
  })
})

describe('history', () => {
  it('最多保留 30 筆', () => {
    saveHistory(Array.from({ length: 40 }, (_, i) => ({ kind: 'brand' as const, id: `${i}`, name: `${i}`, at: i })))
    expect(loadHistory()).toHaveLength(30)
  })
})
