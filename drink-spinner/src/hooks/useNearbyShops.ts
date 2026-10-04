import { useCallback, useEffect, useState } from 'react'
import { fetchNearbyDrinkShops } from '../lib/overpass'
import type { Coords, Shop } from '../types'

type Status = 'locating' | 'loading' | 'ready' | 'error'

const geoErrorMessage = (err: GeolocationPositionError) => {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return '沒有拿到定位權限耶～可以在瀏覽器設定裡允許定位，再試一次'
    case err.POSITION_UNAVAILABLE:
      return '暫時找不到你在哪裡，換個地方或稍後再試試看'
    case err.TIMEOUT:
      return '定位有點久，再試一次看看吧'
    default:
      return '找不到你的位置'
  }
}

/** 取得使用者 GPS 位置後搜尋附近飲料店（依距離排序） */
export function useNearbyShops(favoriteBrands: string[], radius: number) {
  const [status, setStatus] = useState<Status>('locating')
  const [error, setError] = useState<string | null>(null)
  const [coords, setCoords] = useState<Coords | null>(null)
  const [allShops, setAllShops] = useState<Shop[]>([])
  const [attempt, setAttempt] = useState(0)

  const brandsKey = favoriteBrands.join('|')

  useEffect(() => {
    const controller = new AbortController()
    const fail = (message: string) => {
      if (controller.signal.aborted) return
      setStatus('error')
      setError(message)
    }

    if (!navigator.geolocation) {
      queueMicrotask(() => fail('這個瀏覽器不支援 GPS 定位'))
      return () => controller.abort()
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (controller.signal.aborted) return
        const here = { lat: pos.coords.latitude, lon: pos.coords.longitude }
        setCoords(here)
        setStatus('loading')
        fetchNearbyDrinkShops(here, radius, brandsKey ? brandsKey.split('|') : [], controller.signal)
          .then((shops) => {
            setAllShops(shops)
            setStatus('ready')
          })
          .catch(() => fail('飲料店資料暫時抓不到，稍等一下再試試'))
      },
      (err) => fail(geoErrorMessage(err)),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    )
    return () => controller.abort()
  }, [radius, brandsKey, attempt])

  const retry = useCallback(() => {
    setStatus('locating')
    setError(null)
    setAttempt((n) => n + 1)
  }, [])

  return { status, error, coords, shops: allShops, retry }
}
