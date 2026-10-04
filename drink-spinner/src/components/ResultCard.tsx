import { useState } from 'react'
import { Ban, Clock, MapPin, Navigation, Phone, RefreshCw, Search } from 'lucide-react'
import BrandIcon from './BrandIcon'
import { brandOfShop, catalog, findBrand } from '../lib/brands'
import { isOpenNow } from '../lib/openingHours'
import type { Brand, Choice, Shop } from '../types'

const CHEERS = ['就決定是你了！', '今天就喝這家吧！', '命運的選擇出爐～', '好選擇，衝一杯！', '轉盤說：喝這個！']

const formatDistance = (m: number) => (m < 1000 ? `${Math.round(m)} 公尺` : `${(m / 1000).toFixed(1)} 公里`)

const googleSearchUrl = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`

interface ResultCardProps {
  choice: Choice
  onRespin: () => void
  onExclude: (choice: Choice) => void
}

export default function ResultCard({ choice, onRespin, onExclude }: ResultCardProps) {
  const [cheer] = useState(() => CHEERS[Math.floor(Math.random() * CHEERS.length)])
  const ranked = choice.kind === 'brand' ? findBrand(choice.name) : brandOfShop(choice.name)

  return (
    <div className="w-full max-w-md animate-pop overflow-hidden rounded-3xl bg-white shadow-[0_8px_0_#ead2b5,0_16px_40px_rgba(122,90,72,0.18)]">
      <div className="bg-milk px-5 pt-4 pb-3 text-center">
        <p className="text-lg text-caramel">🎉 {cheer}</p>
        <h2 className="mt-2 flex items-center justify-center gap-2 text-3xl text-boba">
          <BrandIcon name={choice.name} size={40} />
          {choice.name}
        </h2>
        {ranked && catalog.rankLabel && (
          <p className="mt-1 text-xs text-cocoa">
            {catalog.rankLabel}第 {ranked.rank} 名{ranked.stores ? `（地圖上登錄約 ${ranked.stores} 間）` : ''}
          </p>
        )}
      </div>

      {choice.kind === 'shop' ? <ShopDetails shop={choice} /> : <BrandDetails brand={choice} />}

      <div className="space-y-3 px-5 pb-5">
        <button
          type="button"
          onClick={onRespin}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-latte bg-cream py-3 text-cocoa transition hover:bg-milk"
        >
          <RefreshCw size={18} /> 不太想，再轉一次
        </button>
        <button
          type="button"
          onClick={() => onExclude(choice)}
          className="mx-auto flex items-center gap-1 text-sm text-cocoa/80 underline-offset-4 hover:underline"
        >
          <Ban size={14} /> {choice.kind === 'shop' ? '不要再出現這間' : '不想喝這個品牌'}
        </button>
      </div>
    </div>
  )
}

function OpenBadge({ hours }: { hours?: string }) {
  const open = isOpenNow(hours)
  if (open === null) return null
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs text-white ${open ? 'bg-matcha' : 'bg-berry'}`}>
      {open ? '營業中' : '休息中'}
    </span>
  )
}

function ShopDetails({ shop }: { shop: Shop }) {
  const d = 0.004
  const bbox = [shop.lon - d, shop.lat - d, shop.lon + d, shop.lat + d].join(',')
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${shop.lat},${shop.lon}`
  const googleSearch = googleSearchUrl(`${shop.name} ${shop.address ?? ''}`.trim())
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lon}&travelmode=walking`

  return (
    <>
      <iframe title={`${shop.name} 地圖`} src={mapSrc} className="h-52 w-full border-0" loading="lazy" />
      <div className="space-y-4 p-5">
        <p className="text-center text-cocoa">
          走過去約 {formatDistance(shop.distance)}（大概 {Math.max(1, Math.round(shop.distance / 80))} 分鐘）
        </p>

        <ul className="space-y-2.5 text-boba">
          <li className="flex items-start gap-2">
            <MapPin size={18} className="mt-0.5 shrink-0 text-caramel" />
            <a href={googleSearch} target="_blank" rel="noreferrer" className="underline decoration-latte decoration-2 underline-offset-4">
              {shop.address ?? '在 Google 地圖看地址'}
            </a>
          </li>
          <li className="flex items-start gap-2">
            <Phone size={18} className="mt-0.5 shrink-0 text-caramel" />
            {shop.phone ? (
              <a href={`tel:${shop.phone.replace(/[^\d+]/g, '')}`} className="underline decoration-latte decoration-2 underline-offset-4">
                {shop.phone}
              </a>
            ) : (
              <a href={googleSearch} target="_blank" rel="noreferrer" className="underline decoration-latte decoration-2 underline-offset-4">
                沒有電話資料，到 Google 地圖查
              </a>
            )}
          </li>
          {shop.openingHours && (
            <li className="flex flex-wrap items-center gap-2">
              <Clock size={18} className="shrink-0 text-caramel" />
              <span className="break-all">{shop.openingHours}</span>
              <OpenBadge hours={shop.openingHours} />
            </li>
          )}
        </ul>

        <a
          href={directions}
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-caramel py-3 text-lg text-white shadow-[0_4px_0_var(--color-caramel-dark)] active:translate-y-0.5 active:shadow-[0_2px_0_var(--color-caramel-dark)]"
        >
          <Navigation size={18} /> 帶我去
        </a>
      </div>
    </>
  )
}

function BrandDetails({ brand }: { brand: Brand }) {
  const query = `${brand.name} 飲料店`
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`

  return (
    <>
      <iframe title={`${brand.name} 地圖`} src={mapSrc} className="h-52 w-full border-0" loading="lazy" />
      <div className="space-y-4 p-5">
        <p className="text-center text-cocoa">沒有開 GPS，在地圖上找找離你最近的分店吧！</p>
        <a
          href={googleSearchUrl(query)}
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-caramel py-3 text-lg text-white shadow-[0_4px_0_var(--color-caramel-dark)] active:translate-y-0.5 active:shadow-[0_2px_0_var(--color-caramel-dark)]"
        >
          <Search size={18} /> 找附近分店和電話
        </a>
      </div>
    </>
  )
}
