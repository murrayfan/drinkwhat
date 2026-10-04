import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { catalog } from '../lib/brands'
import { CONTACT_EMAIL } from '../config'

function Card({ emoji, title, children }: { emoji: string; title: string; children: ReactNode }) {
  return (
    <section className="mb-5 rounded-3xl bg-white p-5 shadow-[0_5px_0_#ead2b5]">
      <h2 className="mb-3 text-xl text-boba">
        <span className="mr-1.5">{emoji}</span>
        {title}
      </h2>
      <div className="space-y-2 leading-relaxed text-cocoa">{children}</div>
    </section>
  )
}

function Faq({ q, children }: { q: string; children: ReactNode }) {
  return (
    <details className="group rounded-2xl bg-cream px-4 py-3 open:bg-milk/60">
      <summary className="cursor-pointer list-none text-boba">
        <span className="mr-1 inline-block transition group-open:rotate-90">›</span> {q}
      </summary>
      <div className="mt-2 text-sm leading-relaxed text-cocoa">{children}</div>
    </details>
  )
}

export default function About() {
  const navigate = useNavigate()
  const rankingText = catalog.source ? `${catalog.source}（${catalog.period}，${catalog.license}）` : '內建清單'

  return (
    <div className="mx-auto max-w-md px-4 pb-12">
      <header className="flex items-center gap-2 pt-5 pb-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="rounded-full bg-white p-2.5 text-cocoa shadow-[0_3px_0_#ead2b5]"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-2xl text-boba">免責聲明與常見問題</h1>
      </header>

      <div className="mb-5 rounded-3xl bg-caramel p-5 text-center text-white shadow-[0_5px_0_var(--color-caramel-dark)]">
        <p className="text-4xl">🧋</p>
        <p className="mt-2 text-lg">本網頁不收集個人資料</p>
        <p className="mt-1 text-sm text-white/90">純粹給有選擇障礙的你參考用，喝什麼最後還是你說了算 😉</p>
      </div>

      <Card emoji="🔒" title="隱私">
        <p>本站沒有會員、沒有後端資料庫，不收集、不保存任何個人資料。</p>
        <p>你的設定和「最近喝過」紀錄只存在<strong className="text-boba">你這台裝置的瀏覽器</strong>裡，可以隨時在設定頁清除，或直接清除瀏覽器的網站資料。</p>
        <p>
          使用 GPS 時，位置只在你的瀏覽器裡使用：座標會傳給 OpenStreetMap 的 Overpass 服務查詢附近店家，本站不會記錄。
          地圖由 OpenStreetMap 或 Google 地圖顯示，字型由 Google Fonts 提供，這些第三方服務會依各自的隱私權政策處理連線資料（例如 IP 位址）。
        </p>
      </Card>

      <Card emoji="📢" title="免責聲明">
        <ul className="list-disc space-y-2 pl-5">
          <li>轉盤結果完全隨機，僅供參考，不代表任何推薦。</li>
          <li>店家位置、電話、營業時間來自 OpenStreetMap 社群，可能過時或不完整，出發前請以店家公告或 Google 地圖為準。</li>
          <li>
            品牌排行是本站依 {rankingText} 自行計算的分店數，只反映地圖上登錄的店數，不代表人氣或品質；
            OpenStreetMap 資料由志工維護，數字可能與實際不同。
          </li>
          <li>所有品牌名稱與商標屬於各自的所有者，本站與各品牌沒有任何合作或代言關係；品牌圖示是自動產生的字首圓章，並非官方標誌。</li>
          <li>使用本站造成的任何損失（例如白跑一趟、店家沒開），本站不負任何責任。</li>
          <li>手搖飲好喝，也請適量，留意糖分與咖啡因 🍵</li>
        </ul>
      </Card>

      <Card emoji="✉️" title="聯絡與移除申請">
        <p>
          如果你是品牌或權利人，認為本站內容侵害你的權益或資訊有誤，請來信告訴我們，確認後會儘快修正或移除。
          一般問題回報也歡迎來信。
        </p>
        {CONTACT_EMAIL ? (
          <p>
            聯絡信箱：<span className="text-boba select-all">{CONTACT_EMAIL}</span>
            {' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2">寄信</a>
          </p>
        ) : (
          <p className="rounded-xl bg-berry/10 px-3 py-2 text-sm text-berry">聯絡信箱尚未設定（網站維護者請在 .env 設定 VITE_CONTACT_EMAIL）</p>
        )}
      </Card>

      <Card emoji="💬" title="常見問題">
        <div className="space-y-2">
          <Faq q="附近明明有店，為什麼沒出現在轉盤上？">
            店家資料來自 OpenStreetMap，由志工社群維護，不一定每間店都有登錄。也請檢查設定：搜尋範圍是否太小、是否開了「只轉喜歡的」「只顯示營業中」，或是把它加進了「不想喝的」。
          </Faq>
          <Faq q="為什麼有些店沒有電話或營業時間？">
            OpenStreetMap 上很多店家沒有填這些資料。沒有電話時，可以點結果卡片上的連結到 Google 地圖查。
          </Faq>
          <Faq q="「營業中」準嗎？">
            只是依照地圖上登錄的營業時間推算，遇到國定假日、店休或資料過時就可能不準，僅供參考。
          </Faq>
          <Faq q="定位一直失敗怎麼辦？">
            請確認瀏覽器允許這個網站使用位置，且手機的定位服務有開。在室內訊號差時可以多試幾次，或直接改用「不用 GPS，隨機 6 種」。
          </Faq>
          <Faq q="不開 GPS 可以用嗎？">
            可以！在設定選「隨機 6 種」，會從排行品牌和你的最愛中隨機挑 6 種給你轉，結果卡片會帶你到 Google 地圖找最近的分店。
          </Faq>
          <Faq q="「喜歡的格子大一倍」是什麼意思？">
            喜歡的品牌在轉盤上的格子是其他店的兩倍大，被轉到的機率也是兩倍，但其他店還是有機會。
          </Faq>
          <Faq q="品牌排行怎麼來的？多久更新？">
            本站每月從 OpenStreetMap（開放授權的地圖資料）統計全台各品牌飲料店的分店數，取前 {catalog.brands.length} 名當預設清單，目前資料是 {rankingText}。
            它只代表店多不多，不代表好不好喝。不在清單裡的品牌，可以在設定頁自己新增。
          </Faq>
          <Faq q="為什麼手機沒有震動？">
            iPhone 的瀏覽器（Safari）不支援網頁震動，Android 的 Chrome 才有。也請確認手機不是靜音或勿擾模式。
          </Faq>
          <Faq q="怎麼清除我的資料？">
            到設定頁最下面的「整理一下」，可以清除最近喝過的紀錄或恢復預設值。
          </Faq>
        </div>
      </Card>
    </div>
  )
}
