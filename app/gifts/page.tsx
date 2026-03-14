'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'

type GiftKey = 'GiftMidAutumn' | 'GiftYearEnd' | 'GiftCalendar'

// 質感 SVG icon（純線條）
const IconSun = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/>
    <line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/>
    <line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>
    <line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
    <line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/>
  </svg>
)
const IconGift = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12"/>
    <rect x="2" y="7" width="20" height="5"/>
    <line x1="12" y1="22" x2="12" y2="7"/>
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
  </svg>
)
const IconCalendar = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <line x1="8" y1="14" x2="8.01" y2="14"/><line x1="12" y1="14" x2="12.01" y2="14"/><line x1="16" y1="14" x2="16.01" y2="14"/>
    <line x1="8" y1="18" x2="8.01" y2="18"/><line x1="12" y1="18" x2="12.01" y2="18"/>
  </svg>
)

const TAB_ICONS: Record<GiftKey, () => JSX.Element> = {
  GiftMidAutumn: IconSun,
  GiftYearEnd: IconGift,
  GiftCalendar: IconCalendar,
}

const GIFT_TABS: { key: GiftKey; label: string }[] = [
  { key: 'GiftMidAutumn', label: '中秋節' },
  { key: 'GiftYearEnd',   label: '年節禮' },
  { key: 'GiftCalendar',  label: '桌曆年曆' },
]

interface GiftRow {
  clientName: string; clientNo: number | null; clientType: string
  clientAddress: string; clientNotes: string
  contactName: string; dept: string; title: string
  phone: string; mobile: string; email: string
  contactNotes: string
}

interface Client {
  id: string; clientNo: number | null; name: string; clientType: string
  address: string; notes: string
  contact1Name: string; contact1Dept: string; contact1Title: string; contact1Phone: string; contact1Mobile: string; contact1Email: string; contact1Notes: string; contact1GiftMidAutumn: boolean; contact1GiftYearEnd: boolean; contact1GiftCalendar: boolean
  contact2Name: string; contact2Dept: string; contact2Title: string; contact2Phone: string; contact2Mobile: string; contact2Email: string; contact2Notes: string; contact2GiftMidAutumn: boolean; contact2GiftYearEnd: boolean; contact2GiftCalendar: boolean
  contact3Name: string; contact3Dept: string; contact3Title: string; contact3Phone: string; contact3Mobile: string; contact3Email: string; contact3Notes: string; contact3GiftMidAutumn: boolean; contact3GiftYearEnd: boolean; contact3GiftCalendar: boolean
  contact4Name: string; contact4Dept: string; contact4Title: string; contact4Phone: string; contact4Mobile: string; contact4Email: string; contact4Notes: string; contact4GiftMidAutumn: boolean; contact4GiftYearEnd: boolean; contact4GiftCalendar: boolean
}

const fmtNo = (n: number | null) => n != null ? `CL-${String(n).padStart(4,'0')}` : '—'

function buildGiftRows(clients: Client[], key: GiftKey): GiftRow[] {
  const rows: GiftRow[] = []
  for (const c of clients) {
    for (let i = 1; i <= 4; i++) {
      if ((c as any)[`contact${i}${key}`]) {
        rows.push({
          clientName: c.name, clientNo: c.clientNo, clientType: c.clientType,
          clientAddress: c.address || '',
          clientNotes: c.notes || '',
          contactName: (c as any)[`contact${i}Name`] || '',
          dept: (c as any)[`contact${i}Dept`] || '',
          title: (c as any)[`contact${i}Title`] || '',
          phone: (c as any)[`contact${i}Phone`] || '',
          mobile: (c as any)[`contact${i}Mobile`] || '',
          email: (c as any)[`contact${i}Email`] || '',
          contactNotes: (c as any)[`contact${i}Notes`] || '',
        })
      }
    }
  }
  return rows
}

function exportCSV(rows: GiftRow[], tabLabel: string) {
  const headers = ['委託單位','客戶編號','類型','姓名','部門','職稱','電話','手機','Email','公司地址','公司備註','聯絡人備註']
  const data = rows.map(r => [
    r.clientName, fmtNo(r.clientNo), r.clientType,
    r.contactName, r.dept, r.title,
    r.phone, r.mobile, r.email,
    r.clientAddress, r.clientNotes, r.contactNotes,
  ])
  const bom = '\uFEFF'
  const csv = bom + [headers, ...data]
    .map(row => row.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `送禮名單_${tabLabel}_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
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

  const grouped: Record<string, GiftRow[]> = {}
  rows.forEach(r => {
    if (!grouped[r.clientName]) grouped[r.clientName] = []
    grouped[r.clientName].push(r)
  })

  const activeLabel = GIFT_TABS.find(t => t.key === activeTab)?.label ?? ''

  // 9 欄：委託單位 / 編號 / 類型 / 姓名 / 部門 / 職稱 / 電話手機 / Email / 地址＋備註
  const COLS = '150px 90px 70px 100px 100px 110px 130px 140px 1fr'
  const HEADERS = ['委託單位','客戶編號','類型','姓名','部門','職稱','電話 / 手機','Email','地址 / 備註']

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

        {/* 節日 Tab */}
        <div style={{display:'flex', gap:10, padding:'14px 16px', borderBottom:'1px solid var(--bd)'}}>
          {GIFT_TABS.map(tab => {
            const isActive = activeTab === tab.key
            const Icon = TAB_ICONS[tab.key]
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'10px 20px', borderRadius:8, cursor:'pointer', transition:'all .15s',
                  border: isActive ? '2px solid var(--blue)' : '2px solid var(--bd)',
                  background: isActive ? 'var(--blue)' : 'var(--bgc)',
                  color: isActive ? '#fff' : 'var(--tx)',
                }}>
                <span style={{opacity: isActive ? 1 : 0.55, display:'flex'}}>
                  <Icon />
                </span>
                <div style={{textAlign:'left'}}>
                  <div style={{fontWeight:700, fontSize:13}}>{tab.label}</div>
                  <div style={{fontSize:11, opacity:.75}}>
                    {loading ? '…' : `${counts[tab.key]} 位`}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* 統計列 + 匯出按鈕 */}
        <div className="stat-bar" style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <span>
            {activeLabel} 送禮名單 — 共 <b>{rows.length}</b> 位{search ? '（篩選中）' : ''}，
            來自 <b>{Object.keys(grouped).length}</b> 家委託單位
          </span>
          <button
            onClick={() => exportCSV(rows, activeLabel)}
            disabled={rows.length === 0}
            style={{
              display:'flex', alignItems:'center', gap:5,
              padding:'5px 12px', borderRadius:5, cursor: rows.length === 0 ? 'not-allowed' : 'pointer',
              border:'1px solid var(--bd)', background:'var(--bgc)',
              color:'var(--tx2)', fontSize:12, fontWeight:600,
              opacity: rows.length === 0 ? 0.4 : 1, transition:'all .12s',
            }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            匯出 Excel
          </button>
        </div>

        <div className="scroll-area">
          {loading ? (
            <div className="loading"><div className="spin"/><span>載入中…</span></div>
          ) : rows.length === 0 ? (
            <div className="loading" style={{padding:'60px 0', flexDirection:'column', gap:8}}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--tx3)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 12 20 22 4 22 4 12"/>
                <rect x="2" y="7" width="20" height="5"/>
                <line x1="12" y1="22" x2="12" y2="7"/>
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
              </svg>
              <span style={{color:'var(--tx3)', fontSize:14}}>此節日無送禮名單</span>
            </div>
          ) : (
            <>
              {/* 表頭 */}
              <div style={{
                display:'grid', gridTemplateColumns:COLS, alignItems:'center',
                padding:'8px 16px', borderBottom:'2px solid var(--bd)',
                background:'var(--bgh)', position:'sticky', top:0, zIndex:2,
              }}>
                {HEADERS.map((h,i) => (
                  <span key={i} style={{fontSize:10, fontWeight:700, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'.05em'}}>{h}</span>
                ))}
              </div>

              {Object.entries(grouped).map(([clientName, crows]) => (
                <div key={clientName}>
                  {/* 公司分組列 */}
                  <div style={{padding:'7px 16px', background:'var(--bgh)', borderBottom:'1px solid var(--bd)', display:'flex', alignItems:'center', gap:8}}>
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
                      display:'grid', gridTemplateColumns:COLS,
                      alignItems:'start', padding:'9px 16px', borderBottom:'1px solid var(--bd)',
                      background: i%2===0 ? 'var(--bgc)' : 'transparent',
                    }}>
                      <span style={{fontSize:12, color:'var(--tx3)', paddingLeft:12, paddingTop:3}}>└</span>
                      <span/>
                      <span/>
                      <span style={{fontSize:13, fontWeight:600, paddingTop:2}}>{r.contactName || '—'}</span>
                      <span style={{fontSize:12, color:'var(--tx2)', paddingTop:2}}>{r.dept || '—'}</span>
                      <span style={{fontSize:12, color:'var(--tx2)', paddingTop:2}}>{r.title || '—'}</span>
                      <div style={{fontSize:12, paddingTop:2}}>
                        {r.phone && <div style={{fontFamily:'var(--m)'}}>{r.phone}</div>}
                        {r.mobile && <div style={{fontFamily:'var(--m)', color:'var(--tx2)'}}>{r.mobile}</div>}
                        {!r.phone && !r.mobile && <span style={{color:'var(--tx3)'}}>—</span>}
                      </div>
                      <span style={{fontSize:11, color:'var(--blue)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', paddingTop:2}}>{r.email || '—'}</span>
                      {/* 地址 + 備註 */}
                      <div style={{fontSize:11, lineHeight:1.7, paddingTop:1}}>
                        {r.clientAddress && (
                          <div>
                            <span style={{color:'var(--tx3)', fontSize:10, fontWeight:600, letterSpacing:'.04em', marginRight:4}}>地址</span>
                            <span style={{color:'var(--tx2)'}}>{r.clientAddress}</span>
                          </div>
                        )}
                        {(r.clientNotes || r.contactNotes) && (
                          <div style={{marginTop: r.clientAddress ? 1 : 0}}>
                            <span style={{color:'var(--tx3)', fontSize:10, fontWeight:600, letterSpacing:'.04em', marginRight:4}}>備註</span>
                            <span style={{color:'var(--tx3)'}}>{[r.clientNotes, r.contactNotes].filter(Boolean).join(' / ')}</span>
                          </div>
                        )}
                        {!r.clientAddress && !r.clientNotes && !r.contactNotes && (
                          <span style={{color:'var(--tx3)'}}>—</span>
                        )}
                      </div>
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
