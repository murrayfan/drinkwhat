import type { WheelEntry } from '../types'

/** 每格的起訖角度（0 度在正上方，順時針） */
export function segmentAngles(entries: WheelEntry[]) {
  const total = entries.reduce((sum, e) => sum + e.weight, 0) || 1
  let start = 0
  return entries.map((e) => {
    const span = (e.weight / total) * 360
    const seg = { start, span }
    start += span
    return seg
  })
}

/**
 * 依權重抽一格，並算出轉盤要轉到的角度（指針固定在正上方）。
 * 停在該格內 15%~85% 的位置，避免剛好壓線。
 */
export function planSpin(entries: WheelEntry[], rotation: number, turns: number, random: () => number = Math.random) {
  const total = entries.reduce((sum, e) => sum + e.weight, 0)
  let r = random() * total
  const index = Math.max(0, entries.findIndex((e) => (r -= e.weight) < 0))
  const { start, span } = segmentAngles(entries)[index]
  const target = start + span * (0.15 + random() * 0.7)
  const delta = (((360 - target - (rotation % 360)) % 360) + 360) % 360
  return { index, rotation: rotation + 360 * turns + delta }
}

/** 轉盤轉了 rotation 度後，指針指著第幾格 */
export function indexAtRotation(entries: WheelEntry[], rotation: number) {
  const pointer = (((360 - rotation) % 360) + 360) % 360
  return segmentAngles(entries).findIndex(({ start, span }) => pointer >= start && pointer < start + span)
}
