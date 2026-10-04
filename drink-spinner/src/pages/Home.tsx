import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Settings as SettingsIcon, Shuffle } from 'lucide-react'
import SpinBoard from '../components/SpinBoard'
import HistoryList from '../components/HistoryList'
import { useNearbyShops } from '../hooks/useNearbyShops'
import { useSettings } from '../hooks/useSettings'
import { useHistory } from '../hooks/useHistory'
import { buildBrandWheel, buildShopWheel, pickRandomBrands, type WheelBuild } from '../lib/choices'
import type { AppSettings, Choice, HistoryEntry } from '../types'

function greeting() {
  const h = new Date().getHours()
  if (h >= 5 && h < 11) return '早安！來杯好喝的開啟一天 ☀️'
  if (h >= 11 && h < 14) return '午安～午餐要配什麼飲料呢？'
  if (h >= 14 && h < 18) return '下午茶時間到囉 🍰'
  if (h >= 18 && h < 22) return '辛苦了，犒賞一下今天的自己吧'
  return '夜深了，來杯無咖啡因的？🌙'
}

interface WheelProps {
  settings: AppSettings
  history: HistoryEntry[]
  onResult: (choice: Choice) => void
  onExclude: (choice: Choice) => void
}

export default function Home() {
  const { settings, update } = useSettings()
  const { history, add } = useHistory()
  // 預設依設定決定；GPS 不順時使用者也可以臨時改用隨機模式
  const [useGps, setUseGps] = useState(settings.useGps)
  const [hello] = useState(greeting)

  const exclude = (choice: Choice) => {
    if (choice.kind === 'shop') {
      update({ excludedShops: [...settings.excludedShops, { id: choice.id, name: choice.name }] })
    } else {
      update({
        excludedBrands: [...settings.excludedBrands, choice.name],
        favoriteBrands: settings.favoriteBrands.filter((b) => b !== choice.name),
      })
    }
  }

  const wheelProps: WheelProps = { settings, history, onResult: add, onExclude: exclude }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center px-4 pb-10">
      <header className="flex w-full items-start justify-between pt-5 pb-6">
        <div>
          <h1 className="flex items-center gap-2 text-3xl text-boba">
            <span className="inline-block animate-bob">🧋</span> 今天喝什麼？
          </h1>
          <p className="mt-1 text-cocoa">{hello}</p>
        </div>
        <Link
          to="/settings"
          aria-label="設定"
          className="rounded-full bg-white p-2.5 text-cocoa shadow-[0_3px_0_#ead2b5] transition hover:rotate-45"
        >
          <SettingsIcon size={22} />
        </Link>
      </header>

      {useGps ? (
        <NearbyWheel {...wheelProps} onSkipGps={() => setUseGps(false)} />
      ) : (
        <RandomWheel {...wheelProps} />
      )}

      <HistoryList history={history} />

      <footer className="mt-auto space-y-1 pt-10 text-center text-xs text-cocoa/80">
        <p>本網頁不收集個人資料，結果僅供選擇障礙的你參考 🙏</p>
        <p>
          <Link to="/about" className="underline underline-offset-2">免責聲明與常見問題</Link>
          {useGps && <span>・店家資料 © OpenStreetMap contributors</span>}
        </p>
      </footer>
    </div>
  )
}

function Message({ emoji, children }: { emoji: string; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center text-cocoa">
      <span className="animate-bob text-6xl">{emoji}</span>
      {children}
    </div>
  )
}

const pillPrimary = 'rounded-full bg-caramel px-6 py-2.5 text-white shadow-[0_4px_0_var(--color-caramel-dark)] active:translate-y-0.5'
const pillSecondary = 'rounded-full border-2 border-latte bg-white px-6 py-2 text-cocoa'

function Notes({ build, summary }: { build: WheelBuild; summary: string }) {
  return (
    <div className="mb-8 flex flex-col items-center gap-2 text-center">
      <p className="rounded-full bg-white/80 px-4 py-1.5 text-sm text-cocoa shadow-sm">{summary}</p>
      {build.notes.map((n) => (
        <p key={n} className="text-sm text-caramel">💡 {n}</p>
      ))}
    </div>
  )
}

function NearbyWheel({ settings, history, onResult, onExclude, onSkipGps }: WheelProps & { onSkipGps: () => void }) {
  const { status, error, shops, retry } = useNearbyShops(settings.favoriteBrands, settings.radius)
  const radiusText = settings.radius >= 1000 ? `${settings.radius / 1000} 公里` : `${settings.radius} 公尺`

  if (status === 'locating' || status === 'loading') {
    return (
      <Message emoji={status === 'locating' ? '📍' : '🔍'}>
        <p className="text-lg">{status === 'locating' ? '正在找你在哪裡…' : `幫你看看 ${radiusText} 內有哪些飲料店…`}</p>
        <button type="button" onClick={onSkipGps} className="text-sm underline underline-offset-4">
          不等了，直接隨機選
        </button>
      </Message>
    )
  }

  if (status === 'error') {
    return (
      <Message emoji="🥲">
        <p className="max-w-xs text-lg">{error}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={retry} className={pillPrimary}>再試一次</button>
          <button type="button" onClick={onSkipGps} className={pillSecondary}>不用 GPS，隨機選 6 間</button>
        </div>
      </Message>
    )
  }

  const build = buildShopWheel(shops, settings, history)

  if (build.entries.length === 0) {
    return (
      <Message emoji="🏜️">
        <p className="text-lg">{radiusText} 內沒找到飲料店耶</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/settings" className={pillPrimary}>擴大搜尋範圍</Link>
          <button type="button" onClick={onSkipGps} className={pillSecondary}>隨機選 6 間</button>
        </div>
      </Message>
    )
  }

  const favCount = build.entries.filter((e) => e.favorite).length
  const summary = `📍 ${radiusText} 內有 ${build.entries.length} 間${favCount ? `，其中 ${favCount} 間是你的最愛 ♥` : ''}`

  return (
    <>
      <Notes build={build} summary={summary} />
      <SpinBoard entries={build.entries} settings={settings} onResult={onResult} onExclude={onExclude} />
    </>
  )
}

function RandomWheel({ settings, history, onResult, onExclude }: WheelProps) {
  const [brands, setBrands] = useState(() => pickRandomBrands(settings, history))
  const build = buildBrandWheel(brands, settings, history)

  if (build.entries.length === 0) {
    return (
      <Message emoji="🙈">
        <p className="max-w-xs text-lg">品牌都被放進「不想喝的」了，留幾個給轉盤吧</p>
        <Link to="/settings" className={pillPrimary}>去設定調整</Link>
      </Message>
    )
  }

  return (
    <>
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <p className="rounded-full bg-white/80 px-4 py-1.5 text-sm text-cocoa shadow-sm">🎲 沒開 GPS，隨機 {build.entries.length} 種飲料店</p>
          <button
            type="button"
            onClick={() => setBrands(pickRandomBrands(settings, history))}
            className="flex items-center gap-1 rounded-full border-2 border-latte bg-white px-3 py-1 text-sm text-cocoa transition hover:bg-milk"
          >
            <Shuffle size={14} /> 換一批
          </button>
        </div>
        {build.notes.map((n) => (
          <p key={n} className="text-sm text-caramel">💡 {n}</p>
        ))}
      </div>
      {/* 換一批時重新掛載轉盤，清除上一次的結果 */}
      <SpinBoard key={brands.join('|')} entries={build.entries} settings={settings} onResult={onResult} onExclude={onExclude} />
    </>
  )
}
