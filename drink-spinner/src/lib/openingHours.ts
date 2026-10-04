/**
 * 簡易解析 OpenStreetMap 的 opening_hours，只支援常見寫法：
 * "24/7"、"10:00-22:00"、"Mo-Fr 09:00-21:00; Sa,Su 10:00-22:00"、"Mo off"、跨夜 "18:00-02:00"。
 * 無法判斷時回傳 null（呼叫端應視為「不確定」而非打烊）。
 */
const DAY_CODES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const DAY = '(?:Mo|Tu|We|Th|Fr|Sa|Su|PH)'
const RULE_RE = new RegExp(`^(?:(${DAY}(?:\\s*-\\s*${DAY})?(?:\\s*,\\s*${DAY}(?:\\s*-\\s*${DAY})?)*)\\s+)?(.+)$`)
const TIME_RE = /^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/

type Interval = [number, number]

function parseDays(spec: string): number[] | null {
  const days = new Set<number>()
  for (const part of spec.split(',').map((p) => p.trim())) {
    if (part === 'PH') continue
    const [from, to] = part.split('-').map((d) => DAY_CODES.indexOf(d.trim()))
    if (from < 0 || (to !== undefined && to < 0)) return null
    if (to === undefined) {
      days.add(from)
    } else {
      for (let d = from; ; d = (d + 1) % 7) {
        days.add(d)
        if (d === to) break
      }
    }
  }
  return [...days]
}

function parseTimes(spec: string): Interval[] | null {
  if (/^(off|closed)$/i.test(spec)) return []
  const intervals: Interval[] = []
  for (const part of spec.split(',').map((p) => p.trim())) {
    const m = TIME_RE.exec(part)
    if (!m) return null
    intervals.push([+m[1] * 60 + +m[2], +m[3] * 60 + +m[4]])
  }
  return intervals
}

export function isOpenNow(spec: string | undefined, now = new Date()): boolean | null {
  if (!spec) return null
  const text = spec.trim()
  if (text === '24/7') return true

  // 規則沒提到的日子視為公休
  const week: Interval[][] = Array.from({ length: 7 }, () => [])
  for (const rule of text.split(';').map((r) => r.trim()).filter(Boolean)) {
    const m = RULE_RE.exec(rule)
    if (!m) return null
    if (m[1] && /^PH$/.test(m[1].trim())) continue
    const days = m[1] ? parseDays(m[1]) : [0, 1, 2, 3, 4, 5, 6]
    const times = parseTimes(m[2].trim())
    if (!days || !times) return null
    for (const d of days) week[d] = times // 後面的規則覆蓋前面
  }

  const today = now.getDay()
  const yesterday = (today + 6) % 7
  const minutes = now.getHours() * 60 + now.getMinutes()
  const openToday = week[today].some(([s, e]) => (e > s ? minutes >= s && minutes < e : minutes >= s))
  const spillFromYesterday = week[yesterday].some(([s, e]) => e <= s && minutes < e)
  return openToday || spillFromYesterday
}
