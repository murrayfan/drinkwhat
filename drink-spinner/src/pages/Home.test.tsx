import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { renderApp } from '../test/render'
import { storeSettings } from '../test/fixtures'

const wheel = () => screen.getByRole('img', { name: /轉盤/ })
const wheelNames = () => wheel().getAttribute('aria-label')!.replace('轉盤：', '').split('、')
const spinButton = () => screen.getByRole('button', { name: /轉一下|轉呀轉/ })

/** 按「轉一下」並讓動畫結束 */
function spinToEnd() {
  fireEvent.click(spinButton())
  expect(spinButton()).toHaveProperty('disabled', true)
  fireEvent.transitionEnd(wheel())
}

function mockGeolocation(result: 'ok' | 'denied') {
  vi.stubGlobal('navigator', {
    ...navigator,
    geolocation: {
      getCurrentPosition: (ok: PositionCallback, fail: PositionErrorCallback) =>
        result === 'ok'
          ? ok({ coords: { latitude: 25.0418, longitude: 121.5436 } } as GeolocationPosition)
          : fail({ code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError),
    },
  })
}

const nearby = {
  elements: [
    { type: 'node', id: 1, lat: 25.0419, lon: 121.5436, tags: { name: '50嵐 敦化店', phone: '02-1111-2222' } },
    { type: 'node', id: 2, lat: 25.0425, lon: 121.5436, tags: { name: '迷客夏 大安店' } },
    { type: 'node', id: 3, lat: 25.043, lon: 121.5436, tags: { name: '可不可熟成紅茶' } },
  ],
}

describe('首頁：不使用 GPS', () => {
  it('隨機 6 種品牌、轉完顯示結果並記錄，再轉一次直接開始轉', () => {
    storeSettings({ useGps: false })
    renderApp()

    expect(screen.getByText(/隨機 6 種飲料店/)).toBeTruthy()
    expect(wheelNames()).toHaveLength(6)

    spinToEnd()
    expect(screen.getByText(/找附近分店和電話/)).toBeTruthy()
    const saved = JSON.parse(localStorage.getItem('drink-spinner:history')!)
    expect(saved).toHaveLength(1)
    expect(wheelNames()).toContain(saved[0].name)

    // 開發手冊：再轉一次時直接開始轉動
    fireEvent.click(screen.getByRole('button', { name: /再轉一次/ }))
    expect(spinButton()).toHaveProperty('disabled', true)
    expect(spinButton().textContent).toContain('轉呀轉')
    expect(screen.queryByText(/找附近分店和電話/)).toBeNull()
  })

  it('換一批會換掉轉盤內容', () => {
    storeSettings({ useGps: false })
    renderApp()
    const before = wheelNames().join()
    let changed = false
    for (let i = 0; i < 10 && !changed; i++) {
      fireEvent.click(screen.getByRole('button', { name: /換一批/ }))
      changed = wheelNames().join() !== before
    }
    expect(changed).toBe(true)
  })

  it('結果卡片「不想喝這個品牌」會加入排除清單並從轉盤移除', () => {
    storeSettings({ useGps: false })
    renderApp()
    spinToEnd()
    const picked = JSON.parse(localStorage.getItem('drink-spinner:history')!)[0].name
    fireEvent.click(screen.getByRole('button', { name: /不想喝這個品牌/ }))
    expect(JSON.parse(localStorage.getItem('drink-spinner:settings')!).excludedBrands).toContain(picked)
    expect(wheelNames()).not.toContain(picked)
  })

  it('保險計時器：transitionend 沒觸發也會結束', () => {
    vi.useFakeTimers()
    storeSettings({ useGps: false, spinSeconds: 2.5 })
    renderApp()
    fireEvent.click(spinButton())
    act(() => vi.advanceTimersByTime(3000))
    expect(screen.getByText(/找附近分店和電話/)).toBeTruthy()
    vi.useRealTimers()
  })
})

describe('首頁：使用 GPS', () => {
  it('定位成功後轉附近店家，結果有地圖、電話、導航', async () => {
    mockGeolocation('ok')
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(nearby))))
    vi.spyOn(Math, 'random').mockReturnValue(0) // 抽第一格（最近的 50嵐）
    storeSettings({ useGps: true })
    renderApp()

    await screen.findByText(/1 公里 內有 3 間/)
    expect(wheelNames()).toEqual(['50嵐 敦化店', '迷客夏 大安店', '可不可熟成紅茶'])

    spinToEnd()
    expect(screen.getByRole('heading', { name: /50嵐 敦化店/ })).toBeTruthy()
    expect(screen.getByText(/全台分店數第 2 名/)).toBeTruthy()
    expect(screen.getByRole('link', { name: '02-1111-2222' }).getAttribute('href')).toBe('tel:0211112222')
    expect(screen.getByRole('link', { name: /帶我去/ }).getAttribute('href')).toContain('destination=25.0419,121.5436')
    expect(screen.getByTitle(/50嵐 敦化店 地圖/)).toBeTruthy()
  })

  it('「不要再出現這間」後該店從轉盤消失', async () => {
    mockGeolocation('ok')
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(nearby))))
    vi.spyOn(Math, 'random').mockReturnValue(0)
    storeSettings({ useGps: true })
    renderApp()
    await screen.findByText(/內有 3 間/)
    spinToEnd()
    fireEvent.click(screen.getByRole('button', { name: /不要再出現這間/ }))
    expect(wheelNames()).not.toContain('50嵐 敦化店')
    expect(screen.getByText(/內有 2 間/)).toBeTruthy()
  })

  it('拒絕定位：顯示原因，可改用隨機模式', async () => {
    mockGeolocation('denied')
    storeSettings({ useGps: true })
    renderApp()
    await screen.findByText(/沒有拿到定位權限/)
    fireEvent.click(screen.getByRole('button', { name: /不用 GPS，隨機選 6 間/ }))
    expect(wheelNames()).toHaveLength(6)
  })

  it('店家資料抓不到：顯示錯誤，重試成功', async () => {
    mockGeolocation('ok')
    const fetchMock = vi.fn(async () => new Response('busy', { status: 504 }))
    vi.stubGlobal('fetch', fetchMock)
    storeSettings({ useGps: true })
    renderApp()
    await screen.findByText(/資料暫時抓不到/)

    fetchMock.mockImplementation(async () => new Response(JSON.stringify(nearby)))
    fireEvent.click(screen.getByRole('button', { name: '再試一次' }))
    await screen.findByText(/內有 3 間/)
  })

  it('附近沒有店：提示擴大範圍', async () => {
    mockGeolocation('ok')
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ elements: [] }))))
    storeSettings({ useGps: true, radius: 500 })
    renderApp()
    await screen.findByText(/500 公尺 內沒找到飲料店/)
    expect(screen.getByRole('link', { name: '擴大搜尋範圍' })).toBeTruthy()
  })
})

describe('首頁：共同', () => {
  it('顯示不收集個人資料聲明與連結', async () => {
    storeSettings({ useGps: false })
    renderApp()
    expect(screen.getByText(/本網頁不收集個人資料/)).toBeTruthy()
    expect(screen.getByRole('link', { name: '免責聲明與常見問題' }).getAttribute('href')).toBe('/about')
    await waitFor(() => expect(screen.getByText(/今天喝什麼/)).toBeTruthy())
  })
})
