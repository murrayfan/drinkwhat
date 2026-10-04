import type { Ref } from 'react'
import { segmentAngles } from '../lib/wheel'
import type { WheelEntry } from '../types'

const COLORS = ['#ffd6a5', '#caffbf', '#a0e7ff', '#d7c8ff', '#ffc8dd', '#fdffb6', '#ffb4a2', '#b9fbc0']

const polar = (angleDeg: number, r: number) => {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: 100 + r * Math.cos(rad), y: 100 + r * Math.sin(rad) }
}

const colorAt = (i: number, n: number) =>
  // 避免最後一格與第一格同色相鄰
  i === n - 1 && n > 1 && i % COLORS.length === 0 ? COLORS[2] : COLORS[i % COLORS.length]

interface WheelProps {
  entries: WheelEntry[]
  rotation: number
  spinning: boolean
  durationMs: number
  onSpinEnd: () => void
  svgRef?: Ref<SVGSVGElement>
}

export default function Wheel({ entries, rotation, spinning, durationMs, onSpinEnd, svgRef }: WheelProps) {
  const segments = segmentAngles(entries)

  return (
    <div className="relative mx-auto aspect-square w-full max-w-80">
      {/* 指針 */}
      <svg viewBox="0 0 40 48" className="absolute left-1/2 -top-3 z-10 w-10 -translate-x-1/2 drop-shadow-md" aria-hidden>
        <path d="M20 46 C 12 32, 4 24, 4 16 A 16 16 0 0 1 36 16 C 36 24, 28 32, 20 46 Z" fill="#b45f25" stroke="#fff" strokeWidth="3" />
        <circle cx="20" cy="16" r="5" fill="#fff" />
      </svg>

      <div className="h-full w-full rounded-full bg-white p-2.5 shadow-[0_10px_0_#ead2b5,0_18px_40px_rgba(122,90,72,0.25)]">
        <svg
          ref={svgRef}
          viewBox="0 0 200 200"
          className="h-full w-full"
          role="img"
          aria-label={`轉盤：${entries.map((e) => e.choice.name).join('、')}`}
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? `transform ${durationMs}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)` : 'none',
          }}
          onTransitionEnd={onSpinEnd}
        >
          {entries.length === 1 ? (
            <circle cx="100" cy="100" r="100" fill={COLORS[0]} />
          ) : (
            entries.map((entry, i) => {
              const { start, span } = segments[i]
              const a = polar(start, 100)
              const b = polar(start + span, 100)
              return (
                <path
                  key={entry.choice.id}
                  d={`M100 100 L${a.x} ${a.y} A100 100 0 ${span > 180 ? 1 : 0} 1 ${b.x} ${b.y} Z`}
                  fill={colorAt(i, entries.length)}
                  stroke="#fff"
                  strokeWidth="1.5"
                />
              )
            })
          )}
          {entries.map((entry, i) => {
            const { start, span } = segments[i]
            const name = entry.choice.name
            const label = `${entry.favorite ? '♥ ' : ''}${name.length > 7 ? `${name.slice(0, 6)}…` : name}`
            return (
              <text
                key={entry.choice.id}
                x="100"
                y="100"
                transform={`rotate(${start + span / 2 - 90} 100 100) translate(90 0)`}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={span >= 40 ? 9 : span >= 28 ? 8 : 7}
                fill="#4a2e20"
                style={{ fontFamily: 'inherit' }}
              >
                {label}
              </text>
            )
          })}
          <circle cx="100" cy="100" r="19" fill="#fff" stroke="#ead2b5" strokeWidth="3" />
          <text x="100" y="101" textAnchor="middle" dominantBaseline="middle" fontSize="20">
            🧋
          </text>
        </svg>
      </div>
    </div>
  )
}
