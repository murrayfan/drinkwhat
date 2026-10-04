import { describe, expect, it } from 'vitest'
import { indexAtRotation, planSpin, segmentAngles } from './wheel'
import { shop } from '../test/fixtures'
import type { WheelEntry } from '../types'

const entries = (...weights: number[]): WheelEntry[] =>
  weights.map((weight, i) => ({ choice: shop(String(i), `店${i}`, i), weight, favorite: weight > 1 }))

describe('segmentAngles', () => {
  it('依權重分配角度且總和 360', () => {
    const segs = segmentAngles(entries(1, 2, 1))
    expect(segs.map((s) => s.span)).toEqual([90, 180, 90])
    expect(segs.map((s) => s.start)).toEqual([0, 90, 270])
  })
})

describe('planSpin', () => {
  it('指針一定停在抽中的那一格（含加權、連續轉動）', () => {
    const list = entries(1, 2, 1, 1, 2, 1, 1)
    let rotation = 0
    for (let i = 0; i < 5000; i++) {
      const plan = planSpin(list, rotation, 6)
      expect(plan.rotation - rotation).toBeGreaterThanOrEqual(360 * 6)
      expect(indexAtRotation(list, plan.rotation)).toBe(plan.index)
      rotation = plan.rotation
    }
  })

  it('依權重抽籤：權重 2 的格子被抽中機率約兩倍', () => {
    const list = entries(1, 2)
    const hits = [0, 0]
    for (let i = 0; i < 6000; i++) hits[planSpin(list, 0, 1).index]++
    expect(hits[1] / hits[0]).toBeGreaterThan(1.7)
    expect(hits[1] / hits[0]).toBeLessThan(2.3)
  })

  it('不會停在格線上（離邊界至少 15%）', () => {
    const list = entries(1, 1, 1, 1)
    for (const r of [0, 0.999999]) {
      const plan = planSpin(list, 0, 1, () => r)
      const pointer = (((360 - plan.rotation) % 360) + 360) % 360
      const { start, span } = segmentAngles(list)[plan.index]
      expect(pointer - start).toBeGreaterThanOrEqual(span * 0.15 - 1e-9)
      expect(start + span - pointer).toBeGreaterThanOrEqual(span * 0.15 - 1e-9)
    }
  })
})
