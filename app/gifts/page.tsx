'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'

type GiftKey = 'GiftMidAutumn' | 'GiftYearEnd' | 'GiftCalendar'
const GIFT_TABS: { key: GiftKey; label: string; emoji: string }[] = [
  { key: 'GiftMidAutumn', label: '中秋節',   emoji: '🎑' },
  { key: 'GiftYearEnd',   label: '年節禮',   emoji: '🧧' },
  { key: 'GiftCalendar',  label: '桌曆年曆', emoji: '📅' },
]

interface GiftRow {
  clientName: string; clientNo: number | null; clientType: string
  contactName: string; dept: string; title: string
  phone: string; mobile: string; email: string
}

interface Client {
  id: string; clientNo: number | null; name: string; clientType: string
  contact1Name: string; contact1Dept: string; contact1Title: string; contact1Phone: string; contact1Mobile: string; contact1Email: string; contact1GiftMidAutumn: boolean; contact1GiftYearEnd: boolean; contact1GiftCalendar: boolean
  contact2Name: string; contact2Dept: string; contact2Title: string; contact2Phone: string; contact2Mobile: string; contact2Email: string; contact2GiftMidAutumn: boolean; contact2GiftYearEnd: boolean; contact2GiftCalendar: boolean
  contact3Name: string; contact3Dept: string; contact3Title: string; contact3Phone: string; contact3Mobile: string; contact3Email: string; contact3GiftMidAutumn: boolean; contact3GiftYearEnd: boolean; contact3GiftCalendar: boolean
  contact4Name: string; contact4Dept: string; contact4Title: string; contact4Phone: string; contact4Mobile: string; contact4Email: string; contact4GiftMidAutumn: boolean; contact4GiftYearEnd: boolean; contact4GiftCalendar: boolean
}

const fmtNo = (n: number | null) => n != null ? `CL-${String(n).padStart(4,'0')}` : '—'

function buildGiftRows(clients: Client[], key: GiftKey): GiftRow[] {
  const rows: GiftRow[] = []
  for (const c of clients) {
    for (let i = 1; i <= 4; i++) {
      if ((c as any)[`contact${i}${key}`]) {
        rows.push({
          clientName: c.name, clientNo: c.clientNo, clientType: c.clientType,
          contactName: (c as any)[`contact${i}Name`] || '',
          dept: (c as any)[`contact${i}Dept`] || '',
          title: (c as any)[`contact${i}Title`] || '',
          phone: (c as any)[`contact${i}Phone`] || '',
          mobile: (c as any)[`contact${i}Mobile`] || '',
          email: (c as any)[`contact${i}Email`] || '',
        })
      }
    }
  }
  return rows
}

export default function GiftsPage() {
  const [activeTab, setActiveTab] = useState<GiftKey>('GiftMidAutumn')
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(d => {
      setClients(Array.isArray(d) ? d : [])
      setLoading(false)
    })
  }, [])

  const allRows = buildGiftRows(clients, activeTab)
  const rows = allRows.filter(r =>
    !search || r.clientName.includes(search) || r.contactName.includes(search) ||
    r.dept.includes(search) || r.title.includes(search)
  )

  const counts = {
    GiftMidAutumn: buildGiftRows(clients, 'GiftMidAutumn').length,
    GiftYearEnd:   buildGiftRows(clients, 'GiftYearEnd').length,
    GiftCalendar:  buildGiftRows(clients, 'GiftCalendar').length,
  }

  // 依委託單位分組
  const grouped: Record<string, GiftRow[]> = {}
  rows.forEach(r => {
    if (!grouped[r.clientName]) grouped[r.clientName] = []
    grouped[r.clientName].push(r)
  })

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <div className="page-hd">
          <h1>送禮篩選</h1>
          <div className="page-hd-r">
            <input className="search-input" placeholder="搜尋委託單位或聯絡人…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* 節日 Tab 卡片 */}
        <div style={{display:'flex', gap:10, padding:'14px 16px', borderBottom:'1px solid var(--bd)'}}>
          {GIFT_TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'10px 18px', borderRadius:8, cursor:'pointer', transition:'all .15s',
                border: activeTab===tab.key ? '2px solid var(--blue)' : '2px solid var(--bd)',
                background: activeTab===tab.key ? 'var(--blue)' : 'var(--bgc)',
                color: activeTab===tab.key ? '#fff' : 'var(--tx)',
              }}>
              <span style={{fontSize:20}}>{tab.emoji}</span>
              <div style={{textAlign:'left'}}>
                <div style={{fontWeight:700, fontSize:13}}>{tab.label}</div>
                <div style={{fontSize:11, opacity:.75}}>
                  {loading ? '…' : `${counts[tab.key]} 位`}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="stat-bar">
          <span>
            {GIFT_TABS.find(t => t.key===activeTab)?.label} 送禮名單 — 共{' '}
            <b>{rows.length}</b> 位{search ? '（篩選中）' : ''}，
            來自 <b>{Object.keys(grouped).length}</b> 家委託單位
          </span>
        </div>

        <div className="scroll-area">
          {loading ? (
            <div className="loading"><div className="spin"/><span>載入中…</span></div>
          ) : rows.length === 0 ? (
            <div className="loading" style={{padding:'60px 0', flexDirection:'column', gap:8}}>
              <span style={{fontSize:36}}>🎁</span>
              <span style={{color:'var(--tx3)', fontSize:14}}>此節日無送禮名單</span>
            </div>
          ) : (
            // 表格表頭
            <>
              <div style={{display:'grid', gridTemplateColumns:'180px 90px 80px 110px 110px 120px 130px 130px', gap:0, alignItems:'center', padding:'8px 16px', borderBottom:'2px solid var(--bd)', background:'var(--bgh)', position:'sticky', top:0, zIndex:2}}>
                {['委託單位','客戶編號','類型','姓名','部門','職稱','電話 / 手機','Email'].map((h,i)=>(
                  <span key={i} style={{fontSize:10, fontWeight:700, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'.05em'}}>{h}</span>
                ))}
              </div>

              {Object.entries(grouped).map(([clientName, crows]) => (
                <div key={clientName}>
                  {/* 公司分組列 */}
                  <div style={{
                    padding:'7px 16px', background:'var(--bgh)', borderBottom:'1px solid var(--bd)',
                    display:'flex', alignItems:'center', gap:8,
                  }}>
                    <span style={{fontWeight:700, fontSize:13}}>{clientName}</span>
                    <span style={{fontSize:11, fontFamily:'var(--m)', color:'var(--tx3)'}}>{fmtNo(crows[0].clientNo)}</span>
                    {crows[0].clientType && (
                      <span style={{fontSize:10, padding:'1px 5px', borderRadius:3, background:'var(--bgc)', border:'1px solid var(--bd)', color:'var(--tx3)'}}>{crows[0].clientType}</span>
                    )}
                    <span style={{fontSize:11, color:'var(--blue)', marginLeft:'auto'}}>{crows.length} 位</span>
                  </div>
                  {/* 每位聯絡人 */}
                  {crows.map((r, i) => (
                    <div key={i} style={{
                      display:'grid', gridTemplateColumns:'180px 90px 80px 110px 110px 120px 130px 130px',
                      alignItems:'center', padding:'9px 16px', borderBottom:'1px solid var(--bd)',
                      background: i%2===0 ? 'var(--bgc)' : 'transparent',
                    }}>
                      <span style={{fontSize:12, color:'var(--tx3)', paddingLeft:12}}>└</span>
                      <span/>
                      <span/>
                      <span style={{fontSize:13, fontWeight:600}}>{r.contactName || '—'}</span>
                      <span style={{fontSize:12, color:'var(--tx2)'}}>{r.dept || '—'}</span>
                      <span style={{fontSize:12, color:'var(--tx2)'}}>{r.title || '—'}</span>
                      <div style={{fontSize:12}}>
                        {r.phone && <div style={{fontFamily:'var(--m)'}}>{r.phone}</div>}
                        {r.mobile && <div style={{fontFamily:'var(--m)', color:'var(--tx2)'}}>{r.mobile}</div>}
                        {!r.phone && !r.mobile && <span style={{color:'var(--tx3)'}}>—</span>}
                      </div>
                      <span style={{fontSize:11, color:'var(--blue)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{r.email || '—'}</span>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
