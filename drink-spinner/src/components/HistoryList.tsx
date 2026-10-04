import BrandIcon from './BrandIcon'
import type { HistoryEntry } from '../types'

const relativeTime = (at: number) => {
  const min = Math.round((Date.now() - at) / 60000)
  if (min < 1) return '剛剛'
  if (min < 60) return `${min} 分鐘前`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr} 小時前`
  const day = Math.round(hr / 24)
  return day === 1 ? '昨天' : `${day} 天前`
}

export default function HistoryList({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0) return null
  return (
    <details className="mt-8 w-full max-w-md rounded-3xl bg-white/80 px-5 py-3 shadow-sm">
      <summary className="cursor-pointer text-cocoa">📒 最近喝過（{Math.min(history.length, 10)}）</summary>
      <ul className="mt-2 divide-y divide-milk">
        {history.slice(0, 10).map((h) => (
          <li key={`${h.id}-${h.at}`} className="flex items-center gap-2 py-2 text-sm">
            <BrandIcon name={h.name} size={24} />
            <span className="flex-1 truncate text-boba">{h.name}</span>
            <span className="shrink-0 text-cocoa/80">{relativeTime(h.at)}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}
