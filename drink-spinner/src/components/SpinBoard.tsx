import { useEffect, useRef, useState } from 'react'
import Wheel from './Wheel'
import { indexAtRotation, planSpin } from '../lib/wheel'
import ResultCard from './ResultCard'
import { playTick, playWin, unlockAudio, vibrate } from '../lib/feedback'
import type { AppSettings, Choice, WheelEntry } from '../types'

interface SpinBoardProps {
  entries: WheelEntry[]
  settings: AppSettings
  onResult: (choice: Choice) => void
  onExclude: (choice: Choice) => void
}

/** 依目前 transform 算出指針指著第幾格 */
function pointerIndex(svg: SVGSVGElement, entries: WheelEntry[]) {
  const { a, b } = new DOMMatrixReadOnly(getComputedStyle(svg).transform)
  return indexAtRotation(entries, (Math.atan2(b, a) * 180) / Math.PI)
}

/** 轉盤 + 開始按鈕 + 結果卡片 */
export default function SpinBoard({ entries, settings, onResult, onExclude }: SpinBoardProps) {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<Choice | null>(null)
  // 轉動中與顯示結果時固定轉盤內容，避免紀錄更新後格子跳動
  const [frozen, setFrozen] = useState<WheelEntry[] | null>(null)
  const shown = frozen ?? entries

  const pending = useRef<Choice | null>(null)
  const spinningRef = useRef(false)
  const safetyTimer = useRef(0)
  const svgRef = useRef<SVGSVGElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const durationMs = settings.spinSeconds * 1000

  useEffect(() => () => window.clearTimeout(safetyTimer.current), [])

  // 轉動時每經過一格發出「喀」聲
  useEffect(() => {
    if (!spinning || !settings.sound || !frozen) return
    let raf = 0
    let last = -1
    const loop = () => {
      if (svgRef.current) {
        const idx = pointerIndex(svgRef.current, frozen)
        if (idx !== last && last !== -1) playTick()
        last = idx
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [spinning, settings.sound, frozen])

  const finish = () => {
    if (!spinningRef.current) return
    spinningRef.current = false
    window.clearTimeout(safetyTimer.current)
    setSpinning(false)
    const choice = pending.current
    setResult(choice)
    if (choice) onResult(choice)
    if (settings.sound) playWin()
    if (settings.vibration) vibrate([60, 40, 120])
  }

  const spin = () => {
    if (spinningRef.current || entries.length === 0) return
    if (settings.sound) unlockAudio()
    if (settings.vibration) vibrate(20)

    const plan = planSpin(entries, rotation, Math.round(settings.spinSeconds * 1.5))
    pending.current = entries[plan.index].choice
    spinningRef.current = true
    setFrozen(entries)
    setResult(null)
    setSpinning(true)
    setRotation(plan.rotation)
    // transitionend 偶爾不會觸發（例如分頁被切走），加個保險
    safetyTimer.current = window.setTimeout(finish, durationMs + 400)
  }

  // 從結果卡片按「再轉一次」：捲回轉盤並直接開始轉動
  const respin = () => {
    boardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    spin()
  }

  const exclude = (choice: Choice) => {
    onExclude(choice)
    setResult(null)
    setFrozen(null)
  }

  return (
    <div ref={boardRef} className="flex w-full scroll-mt-4 flex-col items-center">
      <Wheel
        entries={shown}
        rotation={rotation}
        spinning={spinning}
        durationMs={durationMs}
        onSpinEnd={finish}
        svgRef={svgRef}
      />

      <button
        type="button"
        disabled={spinning}
        onClick={spin}
        className="mt-10 mb-8 rounded-full bg-caramel px-12 py-4 text-xl text-white shadow-[0_6px_0_var(--color-caramel-dark)] transition hover:brightness-105 active:translate-y-1 active:shadow-[0_2px_0_var(--color-caramel-dark)] disabled:translate-y-1 disabled:shadow-[0_2px_0_var(--color-caramel-dark)] disabled:opacity-70"
      >
        {spinning ? '轉呀轉～' : '轉一下！'}
      </button>

      {result && <ResultCard choice={result} onRespin={respin} onExclude={exclude} />}
    </div>
  )
}
