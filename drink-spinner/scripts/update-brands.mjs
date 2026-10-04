/**
 * 從 OpenStreetMap 統計全台飲料店各品牌分店數，產生 src/data/brands.json（前 20 名）。
 * 資料授權：ODbL © OpenStreetMap contributors，使用時須標示來源。
 *
 * 用法：pnpm run update-brands
 *       pnpm run update-brands --save tw.json    （另外保存 Overpass 原始結果）
 *       pnpm run update-brands --input tw.json   （用已下載的 Overpass 結果重算，不連網）
 * 請勿頻繁執行（Overpass 是公益服務），每月一次即可。
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const OUT = new URL('../src/data/brands.json', import.meta.url)
const TOP_N = 20
const MIN_STORES = 3

const QUERY = `
[out:json][timeout:180];
area["ISO3166-1"="TW"][admin_level=2]->.tw;
(
  nwr["shop"="beverages"](area.tw);
  nwr["cuisine"~"(^|;)(bubble_tea|tea|juice)(;|$)"](area.tw);
);
out tags;
`

/**
 * 品牌別名：key 為統一後的品牌名稱。
 * name 為轉盤上顯示的短名稱；keywords 用來比對沒有 brand 標籤的店名。
 */
const ALIASES = {
  '50嵐': { keywords: ['50嵐', '五十嵐'] },
  '清心福全': { keywords: ['清心', '清新福全'] },
  '茶的魔手': { keywords: ['茶的魔手', '茶之魔手', '茶の魔手'] },
  'CoCo都可': { keywords: ['CoCo', '都可'] },
  '迷客夏': { keywords: ['迷客夏', '迷克夏', 'Milksha'] },
  '茶湯會': { keywords: ['茶湯會', 'TP TEA'] },
  '鮮茶道': { keywords: ['鮮茶道'] },
  '大苑子': { keywords: ['大苑子', 'DaYungs'] },
  '可不可熟成紅茶': { name: '可不可', keywords: ['可不可', 'KEBUKE'] },
  '麻古茶坊': { keywords: ['麻古', 'MACU'] },
  '一沐日': { keywords: ['一沐日'] },
  '天仁茗茶': { keywords: ['天仁'] },
  '春水堂人文茶館': { name: '春水堂', keywords: ['春水堂'] },
  '五桐號': { keywords: ['五桐號'] },
  '珍煮丹': { keywords: ['珍煮丹'] },
  'COMEBUY': { keywords: ['COMEBUY', 'Come Buy'] },
  '大茗本位製茶堂': { name: '大茗', keywords: ['大茗'] },
  '喫茶小舖': { keywords: ['喫茶小舖'] },
  '先喝道': { keywords: ['先喝道', 'TAO TAO'] },
  '八曜和茶': { keywords: ['八曜'] },
  'Mr. Wish': { keywords: ['Mr. Wish', 'Mr.Wish'] },
  '一芳': { keywords: ['一芳'] },
  '日出茶太': { keywords: ['日出茶太', 'Chatime'] },
  '得正': { keywords: ['得正', 'Dejeng'] },
  '水巷茶弄': { keywords: ['水巷茶弄'] },
  '康青龍': { keywords: ['康青龍'] },
  '吳家紅茶冰': { keywords: ['吳家紅茶冰'] },
  '老賴茶棧': { keywords: ['老賴'] },
  '清玉': { keywords: ['清玉'] },
  '白巷子': { keywords: ['白巷子'] },
  '龜記茗品': { name: '龜記', keywords: ['龜記'] },
  '紅茶幫': { keywords: ['紅茶幫'] },
  '烏弄': { keywords: ['烏弄', 'UNOCHA'] },
  "Tea's原味": { keywords: ["Tea's原味", "Tea's 原味"] },
  '萬波島嶼紅茶': { name: '萬波', keywords: ['萬波'] },
  '台灣第一味': { keywords: ['第一味'] },
  '花茶大師': { keywords: ['花茶大師'] },
  '十二韻': { keywords: ['十二韻'] },
  '上宇林': { keywords: ['上宇林'] },
  '再睡5分鐘': { keywords: ['再睡5分鐘', '再睡五分鐘'] },
  'UG 樂己': { keywords: ['樂己', 'UG Tea', 'UG樂己'] },
  '顏太煮奶茶': { keywords: ['顏太煮'] },
  '貢茶': { keywords: ['貢茶', 'Gong Cha'] },
}

const lower = (s) => s.toLowerCase()

/** 品牌標籤 → 統一名稱（處理大小寫、別名寫法） */
function canonical(brandTag) {
  const t = lower(brandTag.trim())
  for (const [name, { keywords }] of Object.entries(ALIASES)) {
    if (lower(name) === t || keywords.some((k) => lower(k) === t)) return name
  }
  for (const [name, { keywords }] of Object.entries(ALIASES)) {
    if (keywords.some((k) => t.includes(lower(k)))) return name
  }
  return brandTag.trim()
}

async function fetchShops() {
  const inputIdx = process.argv.indexOf('--input')
  if (inputIdx > -1) return JSON.parse(readFileSync(process.argv[inputIdx + 1], 'utf8')).elements

  for (let attempt = 1; ; attempt++) {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'User-Agent': 'drink-spinner/1.0 (monthly brand stats)' },
      body: new URLSearchParams({ data: QUERY }),
    })
    if (res.ok) {
      const data = await res.json()
      const saveIdx = process.argv.indexOf('--save')
      if (saveIdx > -1) writeFileSync(process.argv[saveIdx + 1], JSON.stringify(data))
      return data.elements
    }
    // 429/504 代表伺服器忙碌，稍等再試
    if (attempt >= 3 || ![429, 502, 503, 504].includes(res.status)) throw new Error(`Overpass 回應 ${res.status}`)
    console.log(`Overpass 忙碌（${res.status}），${attempt * 30} 秒後重試…`)
    await new Promise((r) => setTimeout(r, attempt * 30000))
  }
}

function count(elements) {
  const counts = new Map()
  const add = (brand) => counts.set(brand, (counts.get(brand) ?? 0) + 1)
  let unmatched = 0
  for (const e of elements) {
    const tags = e.tags ?? {}
    if (tags.brand) {
      add(canonical(tags.brand))
      continue
    }
    const name = lower(tags.name ?? '')
    const hit = name && Object.entries(ALIASES).find(([, { keywords }]) => keywords.some((k) => name.includes(lower(k))))
    if (hit) add(hit[0])
    else unmatched++
  }
  return { counts, unmatched }
}

function loadExistingKeywords() {
  if (!existsSync(OUT)) return new Map()
  try {
    const data = JSON.parse(readFileSync(OUT, 'utf8'))
    return new Map((data.brands ?? []).map((b) => [b.fullName, b.keywords ?? []]))
  } catch {
    return new Map()
  }
}

const elements = await fetchShops()
const { counts, unmatched } = count(elements)
const existing = loadExistingKeywords()
const today = new Date().toISOString().slice(0, 10)

const ranked = [...counts.entries()]
  .filter(([, n]) => n >= MIN_STORES)
  .sort((a, b) => b[1] - a[1])
  .slice(0, TOP_N)

const brands = ranked.map(([fullName, stores], i) => {
  const alias = ALIASES[fullName]
  const keywords = [...new Set([...(alias?.keywords ?? [fullName]), ...(existing.get(fullName) ?? [])])]
  return { rank: i + 1, name: alias?.name ?? fullName, fullName, keywords, stores }
})

const output = {
  source: 'OpenStreetMap 全台飲料店分店數統計',
  sourceUrl: 'https://www.openstreetmap.org/copyright',
  license: '© OpenStreetMap contributors（ODbL）',
  rankLabel: '全台分店數',
  period: `${today} 資料快照`,
  updatedAt: today,
  brands,
}

writeFileSync(OUT, JSON.stringify(output, null, 2) + '\n')
console.log(`飲料店 ${elements.length} 間，無法歸類品牌 ${unmatched} 間`)
console.table(brands.map(({ rank, name, stores }) => ({ rank, name, stores })))
console.log(`已寫入 ${OUT.pathname}，請檢查後再提交`)
