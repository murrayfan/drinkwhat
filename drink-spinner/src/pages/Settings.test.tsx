import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderApp } from '../test/render'
import { storeSettings } from '../test/fixtures'

const saved = () => JSON.parse(localStorage.getItem('drink-spinner:settings')!)

describe('設定頁', () => {
  it('顯示前 20 名品牌與資料來源', () => {
    renderApp('/settings')
    expect(screen.getByText(/全台分店數前 20 名/)).toBeTruthy()
    expect(screen.getByText('#1')).toBeTruthy()
    expect(screen.getByText(/OpenStreetMap contributors/)).toBeTruthy()
  })

  it('切換 GPS 模式並儲存', () => {
    renderApp('/settings')
    fireEvent.click(screen.getByRole('radio', { name: /隨機 6 種/ }))
    expect(saved().useGps).toBe(false)
    expect(screen.getByRole('radio', { name: /1 公里/ })).toHaveProperty('disabled', true)
  })

  it('點品牌加入最愛，再點取消', () => {
    renderApp('/settings')
    const btn = screen.getByRole('button', { name: /50嵐/ })
    fireEvent.click(btn)
    expect(saved().favoriteBrands).toEqual(['50嵐'])
    expect(btn.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(btn)
    expect(saved().favoriteBrands).toEqual([])
  })

  it('新增自訂品牌，舊寫法自動轉成排行名稱', () => {
    renderApp('/settings')
    const input = screen.getByPlaceholderText(/其他品牌/)
    fireEvent.change(input, { target: { value: '麻古' } })
    fireEvent.submit(input)
    fireEvent.change(input, { target: { value: '再睡5分鐘' } })
    fireEvent.submit(input)
    expect(saved().favoriteBrands).toEqual(['麻古茶坊', '再睡5分鐘'])
  })

  it('加入不想喝的會從最愛移除，可再移除', () => {
    storeSettings({ favoriteBrands: ['50嵐'] })
    renderApp('/settings')
    const input = screen.getByPlaceholderText('不想喝的品牌')
    fireEvent.change(input, { target: { value: '50嵐' } })
    fireEvent.submit(input)
    expect(saved()).toMatchObject({ excludedBrands: ['50嵐'], favoriteBrands: [] })
    fireEvent.click(screen.getByRole('button', { name: '移除 50嵐' }))
    expect(saved().excludedBrands).toEqual([])
  })

  it('恢復預設值需要確認', () => {
    storeSettings({ radius: 3000, favoriteBrands: ['50嵐'] })
    renderApp('/settings')
    fireEvent.click(screen.getByRole('button', { name: '恢復預設值' }))
    fireEvent.click(screen.getByRole('button', { name: '先不要' }))
    expect(saved().radius).toBe(3000)

    fireEvent.click(screen.getByRole('button', { name: '恢復預設值' }))
    fireEvent.click(screen.getByRole('button', { name: '確定恢復' }))
    expect(saved()).toMatchObject({ radius: 1000, favoriteBrands: [] })
    expect(screen.getByRole('status').textContent).toContain('已恢復預設值')
  })

  it('清除最近喝過紀錄', () => {
    localStorage.setItem('drink-spinner:history', JSON.stringify([{ kind: 'brand', id: '50嵐', name: '50嵐', at: 1 }]))
    renderApp('/settings')
    fireEvent.click(screen.getByRole('button', { name: /清除「最近喝過」紀錄（1 筆）/ }))
    expect(JSON.parse(localStorage.getItem('drink-spinner:history')!)).toEqual([])
  })
})
