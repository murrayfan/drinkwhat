import { ALL_BRAND_KEYWORDS, brandKeywords } from './brands'
import type { Coords, Shop } from '../types'

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

/** 一般手搖飲店名常見關鍵字 */
const DRINK_KEYWORDS = ['茶', '飲', '奶', '珍珠', '果汁', 'tea', 'Tea']

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\"]/g, '\\$&')

export function distanceInMeters(a: Coords, b: Coords) {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function buildAddress(tags: Record<string, string>) {
  if (tags['addr:full']) return tags['addr:full']
  const parts = [
    tags['addr:city'],
    tags['addr:district'],
    tags['addr:street'],
    tags['addr:housenumber'] && `${tags['addr:housenumber']}號`,
  ].filter(Boolean)
  return parts.length ? parts.join('') : undefined
}

/** 透過 OpenStreetMap Overpass API 搜尋附近飲料店，依距離排序 */
export async function fetchNearbyDrinkShops(
  origin: Coords,
  radius: number,
  brands: string[],
  signal?: AbortSignal,
): Promise<Shop[]> {
  const keywords = new Set([...DRINK_KEYWORDS, ...ALL_BRAND_KEYWORDS, ...brands.flatMap(brandKeywords)])
  const namePattern = [...keywords].map(escapeRegex).join('|')
  const around = `around:${radius},${origin.lat},${origin.lon}`
  const query = `
    [out:json][timeout:25];
    (
      nwr["shop"="beverages"](${around});
      nwr["cuisine"~"(^|;)(bubble_tea|tea|juice)(;|$)"](${around});
      nwr["amenity"~"^(cafe|fast_food)$"]["name"~"${namePattern}",i](${around});
      nwr["brand"~"${namePattern}",i](${around});
    );
    out center tags;
  `

  let lastError: unknown
  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: new URLSearchParams({ data: query }),
        signal,
      })
      if (!res.ok) throw new Error(`Overpass ${res.status}`)
      const data = (await res.json()) as { elements: OverpassElement[] }
      return toShops(data.elements, origin)
    } catch (err) {
      if (signal?.aborted) throw err
      lastError = err
    }
  }
  throw lastError
}

function toShops(elements: OverpassElement[], origin: Coords): Shop[] {
  const shops: Shop[] = []
  for (const e of elements) {
    const lat = e.lat ?? e.center?.lat
    const lon = e.lon ?? e.center?.lon
    const tags = e.tags ?? {}
    const name = tags.name ?? tags.brand
    if (lat == null || lon == null || !name) continue
    shops.push({
      kind: 'shop',
      id: `${e.type}/${e.id}`,
      name: tags.branch ? `${name} ${tags.branch}` : name,
      lat,
      lon,
      address: buildAddress(tags),
      phone: tags.phone ?? tags['contact:phone'],
      openingHours: tags.opening_hours,
      distance: distanceInMeters(origin, { lat, lon }),
    })
  }
  return shops.sort((a, b) => a.distance - b.distance)
}
