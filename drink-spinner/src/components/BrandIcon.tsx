import { brandOfShop, findBrand } from '../lib/brands'

// 不使用官方 logo（商標授權），改用品牌字首圓章
const PALETTE = [
  ['#ffd6a5', '#8f4a1b'], ['#caffbf', '#2f5d1a'], ['#a0e7ff', '#1d4f63'], ['#d7c8ff', '#45307a'],
  ['#ffc8dd', '#7a2446'], ['#fdffb6', '#6b5a10'], ['#ffb4a2', '#7a2e1d'], ['#b9fbc0', '#1f5e2c'],
]

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.codePointAt(0)!) >>> 0, 7)

const initials = (name: string) => /^[A-Za-z0-9]{1,2}/.exec(name)?.[0] ?? [...name][0] ?? '?'

interface BrandIconProps {
  /** 品牌或店名，店名會自動對應到所屬品牌 */
  name: string
  size?: number
}

export default function BrandIcon({ name, size = 28 }: BrandIconProps) {
  const brand = findBrand(name) ?? brandOfShop(name)
  const label = brand?.name ?? name
  const [bg, fg] = PALETTE[hash(label) % PALETTE.length]
  const text = initials(label)

  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full border-2 border-white shadow-sm"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: size * (text.length > 1 ? 0.38 : 0.5) }}
    >
      {text}
    </span>
  )
}
