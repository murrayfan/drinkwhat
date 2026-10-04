import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { useSettings } from '../hooks/useSettings'
import { useHistory } from '../hooks/useHistory'
import BrandIcon from '../components/BrandIcon'
import { RANKED_BRAND_NAMES, catalog, findBrand, normalizeBrandNames } from '../lib/brands'
import {
  AVOID_REPEAT_OPTIONS,
  RADIUS_OPTIONS,
  SPIN_SECONDS_OPTIONS,
  WHEEL_SIZE_OPTIONS,
} from '../lib/storage'
import type { FavoriteMode } from '../types'

const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator

function Section({ emoji, title, hint, children }: { emoji: string; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="mb-5 rounded-3xl bg-white p-5 shadow-[0_5px_0_#ead2b5]">
      <h2 className="text-xl text-boba">
        <span className="mr-1.5">{emoji}</span>
        {title}
      </h2>
      {hint && <p className="mt-1 text-sm text-cocoa">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

function Segmented<T extends string | number | boolean>({
  value,
  options,
  onChange,
  disabled,
}: {
  value: T
  options: { value: T; label: ReactNode }[]
  onChange: (v: T) => void
  disabled?: boolean
}) {
  return (
    <div className="flex gap-1 rounded-2xl bg-milk p-1" role="radiogroup">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-xl px-2 py-2 text-sm transition disabled:opacity-50 ${
            value === o.value ? 'bg-white text-boba shadow-sm' : 'text-cocoa hover:bg-white/50'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Toggle({ label, hint, checked, onChange, disabled }: {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className={`flex items-center justify-between gap-4 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <span>
        <span className="text-boba">{label}</span>
        {hint && <span className="block text-xs text-cocoa">{hint}</span>}
      </span>
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="relative h-7 w-12 shrink-0 rounded-full bg-latte transition peer-checked:bg-matcha peer-focus-visible:ring-2 peer-focus-visible:ring-caramel after:absolute after:top-1 after:left-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
    </label>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-sm text-cocoa">{label}</p>
      {children}
    </div>
  )
}

function AddInput({ placeholder, onAdd }: { placeholder: string; onAdd: (v: string) => void }) {
  const [text, setText] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (text.trim()) onAdd(text.trim())
    setText('')
  }
  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-2xl border-2 border-milk bg-cream px-4 py-2 outline-none focus:border-latte"
      />
      <button type="submit" aria-label="新增" className="flex items-center gap-1 rounded-2xl bg-boba px-4 text-white">
        <Plus size={16} /> 新增
      </button>
    </form>
  )
}

function RemovableChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-milk py-1 pr-1.5 pl-3 text-sm text-boba">
      {label}
      <button type="button" onClick={onRemove} aria-label={`移除 ${label}`} className="rounded-full p-0.5 hover:bg-latte">
        <X size={14} />
      </button>
    </span>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const { settings, update, reset } = useSettings()
  const { history, clear: clearHistory } = useHistory()
  const [confirmReset, setConfirmReset] = useState(false)
  const [done, setDone] = useState('')

  const { useGps, favoriteBrands, favoriteMode, excludedBrands, excludedShops } = settings
  const brandOptions = [...new Set([...RANKED_BRAND_NAMES, ...favoriteBrands])].filter((b) => !excludedBrands.includes(b))

  const toggleFavorite = (brand: string) =>
    update({
      favoriteBrands: favoriteBrands.includes(brand)
        ? favoriteBrands.filter((b) => b !== brand)
        : [...favoriteBrands, brand],
    })

  const addFavorite = (input: string) => {
    const [brand] = normalizeBrandNames([input])
    if (favoriteBrands.includes(brand)) return
    update({ favoriteBrands: [...favoriteBrands, brand], excludedBrands: excludedBrands.filter((b) => b !== brand) })
  }

  const addExcluded = (input: string) => {
    const [brand] = normalizeBrandNames([input])
    if (excludedBrands.includes(brand)) return
    update({ excludedBrands: [...excludedBrands, brand], favoriteBrands: favoriteBrands.filter((b) => b !== brand) })
  }

  const flash = (msg: string) => {
    setDone(msg)
    window.setTimeout(() => setDone(''), 2000)
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-12">
      <header className="flex items-center gap-2 pt-5 pb-5">
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label="返回"
          className="rounded-full bg-white p-2.5 text-cocoa shadow-[0_3px_0_#ead2b5]"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-3xl text-boba">設定</h1>
      </header>

      <Section emoji="📍" title="要不要用 GPS？">
        <Segmented
          value={useGps}
          onChange={(v) => update({ useGps: v })}
          options={[
            { value: true, label: '📍 用 GPS 找附近' },
            { value: false, label: '🎲 隨機 6 種' },
          ]}
        />
        <p className="text-sm text-cocoa">
          {useGps ? '轉盤會出現你附近真的有開的飲料店。' : '不用定位，從品牌清單裡隨機挑 6 種給你轉。'}
        </p>
      </Section>

      <Section
        emoji="💛"
        title="喜歡的品牌"
        hint={
          catalog.rankLabel
            ? `下面是${catalog.rankLabel}前 ${catalog.brands.length} 名，點一下加入最愛`
            : '點一下加入最愛，再點一次取消'
        }
      >
        <div className="grid grid-cols-2 gap-2">
          {brandOptions.map((brand) => {
            const active = favoriteBrands.includes(brand)
            const rank = findBrand(brand)?.rank
            return (
              <button
                key={brand}
                type="button"
                aria-pressed={active}
                onClick={() => toggleFavorite(brand)}
                className={`flex items-center gap-2 rounded-2xl border-2 py-2 pr-2 pl-2 text-left text-sm transition active:scale-95 ${
                  active ? 'border-caramel bg-caramel text-white' : 'border-milk bg-cream text-boba hover:border-latte'
                }`}
              >
                <BrandIcon name={brand} size={28} />
                <span className="min-w-0 flex-1 truncate">{brand}</span>
                <span className={`shrink-0 text-xs ${active ? 'text-white' : 'text-cocoa/70'}`}>
                  {active ? '♥' : rank ? (catalog.rankLabel ? `#${rank}` : '') : '自訂'}
                </span>
              </button>
            )
          })}
        </div>
        {catalog.sourceUrl && (
          <p className="text-xs text-cocoa/80">
            排行依據：{catalog.source}（{catalog.period}，每月由作者更新），只代表店數多寡，不代表好不好喝。資料
            <a href={catalog.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              {catalog.license}
            </a>
          </p>
        )}
        <AddInput placeholder="其他品牌，例如：大苑子" onAdd={addFavorite} />
        {favoriteBrands.length > 0 && (
          <Field label="喜歡的品牌要怎麼用？">
            <Segmented<FavoriteMode>
              value={favoriteMode}
              onChange={(v) => update({ favoriteMode: v })}
              options={[
                { value: 'filter', label: '只轉喜歡的' },
                { value: 'weight', label: '喜歡的格子大一倍' },
              ]}
            />
          </Field>
        )}
      </Section>

      <Section emoji="🙅" title="不想喝的" hint="這些品牌或店家永遠不會出現在轉盤上">
        <AddInput placeholder="不想喝的品牌" onAdd={addExcluded} />
        {excludedBrands.length + excludedShops.length === 0 ? (
          <p className="text-sm text-cocoa/80">目前沒有～也可以在轉到時按「不要再出現這間」</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {excludedBrands.map((b) => (
              <RemovableChip key={b} label={b} onRemove={() => update({ excludedBrands: excludedBrands.filter((x) => x !== b) })} />
            ))}
            {excludedShops.map((s) => (
              <RemovableChip
                key={s.id}
                label={`🏠 ${s.name}`}
                onRemove={() => update({ excludedShops: excludedShops.filter((x) => x.id !== s.id) })}
              />
            ))}
          </div>
        )}
      </Section>

      <Section emoji="🎡" title="轉盤">
        <Field label={`搜尋範圍${useGps ? '' : '（GPS 模式才有用）'}`}>
          <Segmented
            value={settings.radius}
            disabled={!useGps}
            onChange={(v) => update({ radius: v })}
            options={RADIUS_OPTIONS.map((r) => ({ value: r, label: r >= 1000 ? `${r / 1000} 公里` : `${r} 公尺` }))}
          />
        </Field>
        <Field label={useGps ? '最多幾格' : '最多幾格（隨機模式固定 6 種）'}>
          <Segmented
            value={settings.wheelSize}
            disabled={!useGps}
            onChange={(v) => update({ wheelSize: v })}
            options={WHEEL_SIZE_OPTIONS.map((n) => ({ value: n, label: `${n} 格` }))}
          />
        </Field>
        <Field label="最近喝過的先跳過">
          <Segmented
            value={settings.avoidRepeat}
            onChange={(v) => update({ avoidRepeat: v })}
            options={AVOID_REPEAT_OPTIONS.map((n) => ({ value: n, label: n === 0 ? '不用' : `最近 ${n} 次` }))}
          />
        </Field>
        <Toggle
          label="只顯示營業中的店"
          hint="很多店沒有營業時間資料，這些會照樣顯示"
          checked={settings.onlyOpen}
          disabled={!useGps}
          onChange={(v) => update({ onlyOpen: v })}
        />
      </Section>

      <Section emoji="🔔" title="轉動效果">
        <Field label="轉多久">
          <Segmented
            value={settings.spinSeconds}
            onChange={(v) => update({ spinSeconds: v })}
            options={SPIN_SECONDS_OPTIONS}
          />
        </Field>
        <Toggle label="音效" hint="轉動時喀喀聲、停下來叮咚" checked={settings.sound} onChange={(v) => update({ sound: v })} />
        <Toggle
          label="震動"
          hint={canVibrate ? '轉出結果時手機會震一下' : '這個裝置不支援震動'}
          checked={settings.vibration && canVibrate}
          disabled={!canVibrate}
          onChange={(v) => update({ vibration: v })}
        />
      </Section>

      <Section emoji="🧹" title="整理一下">
        <button
          type="button"
          disabled={history.length === 0}
          onClick={() => {
            clearHistory()
            flash('最近喝過的紀錄清掉囉')
          }}
          className="w-full rounded-2xl border-2 border-milk bg-cream py-2.5 text-boba disabled:opacity-50"
        >
          清除「最近喝過」紀錄{history.length ? `（${history.length} 筆）` : ''}
        </button>
        {confirmReset ? (
          <div className="rounded-2xl bg-berry/10 p-3 text-center">
            <p className="mb-3 text-sm text-boba">確定要把所有設定恢復成預設嗎？</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmReset(false)} className="flex-1 rounded-xl bg-white py-2 text-cocoa">
                先不要
              </button>
              <button
                type="button"
                onClick={() => {
                  reset()
                  setConfirmReset(false)
                  flash('已恢復預設值 ✨')
                }}
                className="flex-1 rounded-xl bg-berry py-2 text-white"
              >
                確定恢復
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmReset(true)} className="w-full rounded-2xl py-2 text-berry underline-offset-4 hover:underline">
            恢復預設值
          </button>
        )}
        {done && <p className="text-center text-sm text-matcha" role="status">{done}</p>}
      </Section>

      <button
        type="button"
        onClick={() => navigate('/')}
        className="mt-2 w-full rounded-full bg-caramel py-4 text-xl text-white shadow-[0_6px_0_var(--color-caramel-dark)] active:translate-y-1 active:shadow-[0_2px_0_var(--color-caramel-dark)]"
      >
        好了，去轉轉盤！
      </button>

      <p className="mt-6 text-center text-sm">
        <Link to="/about" className="text-cocoa underline underline-offset-4">
          免責聲明與常見問題
        </Link>
      </p>
    </div>
  )
}
