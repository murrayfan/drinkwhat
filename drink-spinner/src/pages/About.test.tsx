import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

async function renderAbout() {
  vi.resetModules()
  const { default: About } = await import('./About')
  render(<MemoryRouter><About /></MemoryRouter>)
}

describe('免責聲明與常見問題', () => {
  it('有隱私、免責、聯絡、常見問題', async () => {
    await renderAbout()
    expect(screen.getByText('本網頁不收集個人資料')).toBeTruthy()
    for (const title of ['隱私', '免責聲明', '聯絡與移除申請', '常見問題']) {
      expect(screen.getByRole('heading', { level: 2, name: new RegExp(title) })).toBeTruthy()
    }
    expect(screen.getAllByText(/OpenStreetMap/).length).toBeGreaterThan(0)
    expect(screen.queryByText(/網路溫度計|DailyView/)).toBeNull()
  })

  it('有設定聯絡信箱時顯示', async () => {
    vi.stubEnv('VITE_CONTACT_EMAIL', 'hello@example.com')
    await renderAbout()
    expect(screen.getByText('hello@example.com')).toBeTruthy()
  })

  it('沒設定聯絡信箱時提示維護者', async () => {
    vi.stubEnv('VITE_CONTACT_EMAIL', '')
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    await renderAbout()
    expect(screen.getByText(/聯絡信箱尚未設定/)).toBeTruthy()
  })
})
