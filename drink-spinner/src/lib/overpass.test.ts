import { describe, expect, it, vi } from 'vitest'
import { distanceInMeters, fetchNearbyDrinkShops } from './overpass'

const origin = { lat: 25.0418, lon: 121.5436 }

const overpassResponse = {
  elements: [
    { type: 'node', id: 2, lat: 25.0428, lon: 121.5436, tags: { name: '迷客夏', phone: '02-1234-5678', opening_hours: '10:00-22:00' } },
    { type: 'way', id: 1, center: { lat: 25.0419, lon: 121.5436 }, tags: { brand: '50嵐', branch: '敦化店', 'addr:city': '臺北市', 'addr:street': '敦化南路', 'addr:housenumber': '1' } },
    { type: 'node', id: 3, lat: 25.05, lon: 121.55, tags: {} }, // 沒名字，略過
  ],
}

const okResponse = () => new Response(JSON.stringify(overpassResponse), { status: 200 })

describe('distanceInMeters', () => {
  it('緯度差 0.001 度約 111 公尺', () => {
    expect(distanceInMeters(origin, { ...origin, lat: origin.lat + 0.001 })).toBeCloseTo(111.2, 0)
  })
})

describe('fetchNearbyDrinkShops', () => {
  it('轉成店家資料並依距離排序', async () => {
    const fetchMock = vi.fn(async () => okResponse())
    vi.stubGlobal('fetch', fetchMock)

    const shops = await fetchNearbyDrinkShops(origin, 1000, ['麻古茶坊'])
    expect(shops.map((s) => s.name)).toEqual(['50嵐 敦化店', '迷客夏'])
    expect(shops[0]).toMatchObject({ id: 'way/1', kind: 'shop', address: '臺北市敦化南路1號' })
    expect(shops[1]).toMatchObject({ phone: '02-1234-5678', openingHours: '10:00-22:00' })

    const body = String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body)
    const query = new URLSearchParams(body).get('data')!
    expect(query).toContain('around:1000,25.0418,121.5436')
    expect(query).toContain('MACU') // 喜歡品牌的關鍵字也會拿來搜尋
  })

  it('第一台伺服器失敗時改用備援', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('busy', { status: 504 }))
      .mockResolvedValueOnce(okResponse())
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchNearbyDrinkShops(origin, 500, [])).resolves.toHaveLength(2)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('全部失敗時丟出錯誤', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('busy', { status: 429 })))
    await expect(fetchNearbyDrinkShops(origin, 500, [])).rejects.toThrow('429')
  })
})
