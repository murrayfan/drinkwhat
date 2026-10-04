import { describe, expect, it } from 'vitest'
import { isOpenNow } from './openingHours'

// 2026-10-04 是星期日、10-05 星期一、10-07 星期三
const cases: [string | undefined, string, boolean | null][] = [
  [undefined, '2026-10-05T12:00', null],
  ['24/7', '2026-10-05T03:00', true],
  ['10:00-22:00', '2026-10-05T09:59', false],
  ['10:00-22:00', '2026-10-05T10:00', true],
  ['10:00-22:00', '2026-10-05T22:00', false],
  ['Mo-Fr 09:00-21:00; Sa,Su 10:00-22:00', '2026-10-04T09:30', false],
  ['Mo-Fr 09:00-21:00; Sa,Su 10:00-22:00', '2026-10-05T09:30', true],
  ['Mo-Su 10:00-22:00; Mo off', '2026-10-05T12:00', false],
  ['18:00-02:00', '2026-10-05T01:00', true],
  ['18:00-02:00', '2026-10-05T03:00', false],
  ['Fr-Mo 11:00-20:00', '2026-10-04T12:00', true],
  ['Fr-Mo 11:00-20:00', '2026-10-07T12:00', false],
  ['Mo-Fr 11:00-14:00,17:00-21:00', '2026-10-05T15:00', false],
  ['Mo-Fr 11:00-14:00,17:00-21:00', '2026-10-05T18:00', true],
  ['Mo-Su 10:00-22:00; PH off', '2026-10-05T12:00', true],
  ['10:00+', '2026-10-05T12:00', null],
  ['sunrise-sunset', '2026-10-05T12:00', null],
]

describe('isOpenNow', () => {
  it.each(cases)('%s @ %s → %s', (spec, at, expected) => {
    expect(isOpenNow(spec, new Date(at))).toBe(expected)
  })
})
