'use client'
import { useEffect, useState, useMemo } from 'react'
import Sidebar from '@/components/Sidebar'

// 收據號碼自動生成：RC-YYYYMM-NNN
function genReceiptNo(existing: any[]): string {
  const now = new Date()
  const prefix = `RC-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}-`
  const nums = existing
    .map(r => r.receiptNo || r.receiptNoAuto || '')
    .filter(s => s.startsWith(prefix))
    .map(s => parseInt(s.slice(prefix.length)) || 0)
  const next = (Math.max(0, ...nums) + 1)
  return prefix + String(next).padStart(3, '0')
}

const STAFF_MAP: Record<string, string> = {
  '黃慈妮': '慈妮', '徐文靜': '文靜', '張博宇': '博宇',
  '吳韋萱': '韋萱', '許紘齊': '紘齊', '方謙': '方謙',
  '郭旭庭': '旭庭', '黃湞儀': '湞儀',
}
const TEAM_MAP: Record<string, string> = {
  '黃慈妮': '妮組', '許紘齊': '妮組', '吳韋萱': '妮組',
  '徐文靜': '文組', '黃湞儀': '文組', '方謙': '文組', '郭旭庭': '文組',
  '張博宇': '未派',
}
const LEADER_MAP: Record<string, string> = { '妮組': '黃慈妮', '文組': '徐文靜' }
const PC: Record<string, string> = {
  黃慈妮: '#B45309', 徐文靜: '#065F46', 許紘齊: '#9F1239',
  吳韋萱: '#4338CA', 黃湞儀: '#BE185D', 郭旭庭: '#92400E', 方謙: '#1E40AF', 張博宇: '#374151',
}

const fmt = (n: number | null | undefined) => n == null ? '—' : '$' + Math.round(n).toLocaleString()
const fd = (d: string) => { if (!d) return '—'; const t = new Date(d); return `${t.getFullYear()}/${t.getMonth()+1}/${t.getDate()}` }
const statusColor: Record<string, string> = { '請款中': '#3b82f6', '請款中列獎金': '#f59e0b', '已收款': '#16a34a' }

export default function ReceiptsPage() {
  const [cases, setCases] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'issue'|'list'|'bonus'>('issue')

  // 開立表單
  const [search, setSearch] = useState('')
  const [searchMode, setSearchMode] = useState<'client'|'case'>('client')
  const [selCase, setSelCase] = useState<any>(null)
  const [selPayment, setSelPayment] = useState<any>(null)
  const [receiptNo, setReceiptNo] = useState('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0,10))
  const [payStatus, setPayStatus] = useState('請款中')
  const [receiptNote, setReceiptNote] = useState('')
  const [bonusNote, setBonusNote] = useState('')
  const [extraBonus, setExtraBonus] = useState('')
  const [extraBonusTarget, setExtraBonusTarget] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string|null>(null)

  // 列表篩選
  const [listSearch, setListSearch] = useState('')
  const [listStatus, setListStatus] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/cases').then(r=>r.json()),
      fetch('/api/payments').then(r=>r.json()),
    ]).then(([c, p]) => {
      setCases(Array.isArray(c) ? c : [])
      setPayments(Array.isArray(p) ? p : [])
      setLoading(false)
    })
  }, [])

  // 搜尋結果
  const searchResults = useMemo(() => {
    if (!search.trim()) return []
    if (searchMode === 'client') {
      const clients = [...new Set(cases.map(c => c.clientName).filter(Boolean))]
      return clients.filter(n => n.includes(search)).slice(0, 8).map(n => ({ type: 'client', name: n }))
    } else {
      return cases.filter(c => c.name?.includes(search) || c.clientName?.includes(search)).slice(0, 8).map(c => ({ type: 'case', ...c }))
    }
  }, [search, searchMode, cases])

  // 選擇客戶/案件後，找出可開立的款項
  const availablePayments = useMemo(() => {
    if (!selCase) return []
    return payments.filter(p => p.caseId === selCase.id)
  }, [selCase, payments])

  // 已開立收據
  const issuedReceipts = useMemo(() =>
    payments.filter(p => p.receiptNo || p.invoiceDate).sort((a, b) =>
      (b.invoiceDate || '').localeCompare(a.invoiceDate || '')
    )
  , [payments])

  const filteredReceipts = useMemo(() => issuedReceipts.filter(r => {
    if (listSearch && !r.caseName?.includes(listSearch) && !r.receiptNo?.includes(listSearch)) return false
    if (listStatus && r.status !== listStatus) return false
    return true
  }), [issuedReceipts, listSearch, listStatus])

  // 獎金計算（僅「請款中列獎金」和「已收款」）
  const bonusReceipts = useMemo(() =>
    payments.filter(p => p.status === '請款中列獎金' || p.status === '已收款' || p.payStatus === '請款中列獎金' || p.payStatus === '已收款')
  , [payments])

  const bonusByTeam = useMemo(() => {
    const byTeam: Record<string, any[]> = { 妮組: [], 文組: [] }
    for (const r of bonusReceipts) {
      const c = cases.find(x => x.id === r.caseId)
      if (!c) continue
      const team = c.team === '妮組' ? '妮組' : '文組'
      byTeam[team].push({ ...r, case: c })
    }
    return byTeam
  }, [bonusReceipts, cases])

  const calcBonus = (r: any) => {
    const amt = r.receivedAmount || r.amount || 0
    const c = r.case || cases.find((x: any) => x.id === r.caseId)
    const assignees = c?.assignees || []
    const team = c?.team || ''
    const leader = LEADER_MAP[team]
    const isNonLeading = c?.leadingTypeField === '非領銜'
    const companyShare = isNonLeading ? amt * 0.3 : 0
    const baseAmt = amt - companyShare  // 非領銜扣掉公司分紅後才計算
    return {
      personal: baseAmt * 0.025 / Math.max(assignees.length, 1),
      leaderBonus: baseAmt * 0.015,
      teamPool: baseAmt * 0.03,
      companyShare,
      assignees,
      leader,
      total: baseAmt * (0.025 + 0.015 + 0.03),
    }
  }

  const handleIssue = async () => {
    if (!selPayment) { alert('請選擇要開立的期款'); return }
    setSaving(true)
    try {
      const payload = {
        id: selPayment.id,
        receiptNo,
        invoiceDate: issueDate,
        receivedDate: payStatus === '已收款' ? issueDate : undefined,
        status: payStatus,
        notes: receiptNote,
      }
      const res = await fetch('/api/payments', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) { alert('開立失敗'); return }
      // 重新載入
      const p = await fetch('/api/payments').then(r=>r.json())
      setPayments(Array.isArray(p) ? p : [])
      // 清空表單
      setSelCase(null); setSelPayment(null); setSearch(''); setReceiptNote('')
      setPayStatus('請款中'); setReceiptNo('')
      alert(`✅ 收據 ${receiptNo} 開立成功`)
      setActiveTab('list')
    } finally { setSaving(false) }
  }

  if (loading) return (
    <div className="app"><Sidebar />
      <div className="main"><div className="loading"><div className="spin"/><span>載入中…</span></div></div>
    </div>
  )

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <div className="page-hd">
          <h1>收據開立</h1>
          <div className="page-hd-r">
            {(['issue','list','bonus'] as const).map(t => (
              <button key={t} className={`btn btn-sm ${activeTab===t?'btn-primary':'btn-ghost'}`} onClick={()=>setActiveTab(t)}>
                {t==='issue'?'開立收據':t==='list'?'已開立清單':'獎金分配'}
              </button>
            ))}
          </div>
        </div>

        {/* ── 開立收據 ── */}
        {activeTab==='issue' && (
          <div style={{padding:'20px 24px', maxWidth:700}}>

            {/* 搜尋區 */}
            <div style={{padding:16,borderRadius:10,border:'1px solid var(--bd)',background:'var(--bgc)',marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:10}}>搜尋案件</div>
              <div style={{display:'flex',gap:6,marginBottom:10}}>
                {(['client','case'] as const).map(m=>(
                  <button key={m} onClick={()=>{setSearchMode(m);setSearch('');setSelCase(null)}}
                    style={{padding:'4px 12px',borderRadius:5,border:'1px solid var(--bd)',cursor:'pointer',fontSize:12,
                      background:searchMode===m?'var(--blue)':'var(--bgc)',color:searchMode===m?'#fff':'var(--tx3)'}}>
                    {m==='client'?'依委託單位':'依案件名稱'}
                  </button>
                ))}
              </div>
              <div className="dd-wrap">
                <input className="fi" value={search}
                  onChange={e=>setSearch(e.target.value)}
                  placeholder={searchMode==='client'?'搜尋委託單位名稱…':'搜尋案件名稱…'} />
                {search && searchResults.length>0 && (
                  <div className="dd">
                    {searchResults.map((r:any,i) => {
                      if (r.type==='client') {
                        const clientCases = cases.filter(c=>c.clientName===r.name)
                        return (
                          <div key={i}>
                            <div style={{padding:'6px 12px',fontSize:10,fontWeight:700,color:'var(--tx3)',background:'var(--bgh)'}}>{r.name} — {clientCases.length} 個案件</div>
                            {clientCases.map((c:any)=>(
                              <div key={c.id} className="dd-opt" style={{paddingLeft:20}} onClick={()=>{setSelCase(c);setSearch(c.name);setSelPayment(null)}}>
                                {c.name} <span className="dd-sub">{c.status}</span>
                              </div>
                            ))}
                          </div>
                        )
                      }
                      return (
                        <div key={i} className="dd-opt" onClick={()=>{setSelCase(r);setSearch(r.name);setSelPayment(null)}}>
                          {r.name} <span className="dd-sub">{r.clientName}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 選擇案件後顯示 */}
            {selCase && (
              <div style={{padding:16,borderRadius:10,border:'1px solid color-mix(in srgb,var(--blue) 25%,transparent)',background:'color-mix(in srgb,var(--blue) 5%,transparent)',marginBottom:16}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:14}}>{selCase.name}</div>
                    <div style={{fontSize:11,color:'var(--tx3)',marginTop:2}}>{selCase.clientName} · {selCase.team} · {selCase.status}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:11,color:'var(--tx3)'}}>服務費用</div>
                    <div style={{fontFamily:'var(--m)',fontWeight:700}}>{fmt(selCase.contractAmount)}</div>
                  </div>
                </div>

                {/* 選擇期款 */}
                <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',marginBottom:6}}>選擇要開立的期款</div>
                {availablePayments.length===0 ? (
                  <div style={{fontSize:12,color:'var(--tx3)',padding:'8px 0'}}>此案件尚無分期款項記錄，請先在案件查詢中設定分期</div>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',gap:5}}>
                    {availablePayments.map(p=>(
                      <label key={p.id} style={{
                        display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:6,cursor:'pointer',
                        border:`1px solid ${selPayment?.id===p.id?'var(--blue)':'var(--bd)'}`,
                        background:selPayment?.id===p.id?'color-mix(in srgb,var(--blue) 8%,transparent)':'var(--bgc)',
                      }}>
                        <input type="radio" style={{accentColor:'var(--blue)'}} checked={selPayment?.id===p.id}
                          onChange={()=>{
                            setSelPayment(p)
                            setReceiptNo(genReceiptNo(payments))
                          }} />
                        <span style={{fontWeight:600,fontSize:12}}>{p.period || '期款'}</span>
                        <span style={{fontSize:11,color:'var(--tx3)'}}>{p.ratePct ? p.ratePct+'%' : ''}</span>
                        <span style={{fontFamily:'var(--m)',fontSize:13,marginLeft:'auto'}}>{fmt(p.amount)}</span>
                        {p.receiptNo && <span style={{fontSize:10,color:'var(--tx3)'}}>已開：{p.receiptNo}</span>}
                        {p.status && (
                          <span style={{fontSize:10,padding:'1px 5px',borderRadius:3,
                            background:statusColor[p.status]+'20',color:statusColor[p.status]}}>
                            {p.status}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 開立表單 */}
            {selPayment && (
              <div style={{padding:16,borderRadius:10,border:'1px solid var(--bd)',background:'var(--bgc)'}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:12}}>收據資訊</div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                  <div className="fg">
                    <label style={{display:'flex',alignItems:'center',gap:6}}>
                      收據號碼
                      <span style={{fontSize:10,color:'var(--tx3)',fontWeight:400}}>(自動產生，可修改)</span>
                    </label>
                    <input className="fi" value={receiptNo} onChange={e=>setReceiptNo(e.target.value)}
                      style={{fontFamily:'var(--m)',fontWeight:600}} />
                  </div>
                  <div className="fg">
                    <label>開立日期</label>
                    <input type="date" className="fi" value={issueDate} onChange={e=>setIssueDate(e.target.value)} />
                  </div>
                </div>

                <div className="fg" style={{marginBottom:10}}>
                  <label>付款狀態</label>
                  <div style={{display:'flex',gap:6}}>
                    {['請款中','請款中列獎金','已收款'].map(s=>(
                      <button key={s} onClick={()=>setPayStatus(s)}
                        style={{flex:1,padding:'7px 4px',borderRadius:6,cursor:'pointer',fontSize:11,fontWeight:600,
                          border:`1.5px solid ${payStatus===s?(statusColor[s]||'var(--blue)'):'var(--bd)'}`,
                          background:payStatus===s?(statusColor[s]+'20'):'var(--bgc)',
                          color:payStatus===s?(statusColor[s]||'var(--tx)'):'var(--tx3)'}}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 選擇「列獎金」或「已收款」時顯示加碼獎金 */}
                {(payStatus==='請款中列獎金'||payStatus==='已收款') && (
                  <div style={{padding:12,borderRadius:8,background:'color-mix(in srgb,#f59e0b 8%,transparent)',border:'1px solid color-mix(in srgb,#f59e0b 25%,transparent)',marginBottom:10}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#b45309',marginBottom:8}}>加碼獎金（選填）</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                      <div className="fg">
                        <label>加碼金額（元）</label>
                        <input type="number" className="fi" value={extraBonus} onChange={e=>setExtraBonus(e.target.value)} placeholder="0" />
                      </div>
                      <div className="fg">
                        <label>派發給</label>
                        <input className="fi" value={extraBonusTarget} onChange={e=>setExtraBonusTarget(e.target.value)} placeholder="例：黃慈妮" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="fg" style={{marginBottom:14}}>
                  <label>備註</label>
                  <textarea className="dp-note" style={{minHeight:48}} value={receiptNote} onChange={e=>setReceiptNote(e.target.value)} />
                </div>

                {/* 獎金預覽（列獎金時） */}
                {(payStatus==='請款中列獎金'||payStatus==='已收款') && selCase && (() => {
                  const amt = selPayment.receivedAmount || selPayment.amount || 0
                  const assignees = selCase.assignees || []
                  const isNonLeading = selCase.leadingTypeField === '非領銜'
                  const companyShare = isNonLeading ? amt * 0.3 : 0
                  const baseAmt = amt - companyShare
                  const personalBonus = baseAmt * 0.025 / Math.max(assignees.length, 1)
                  const leaderBonus = baseAmt * 0.015
                  const teamPool = baseAmt * 0.03
                  return (
                    <div style={{padding:12,borderRadius:8,background:'color-mix(in srgb,var(--blue) 5%,transparent)',border:'1px solid color-mix(in srgb,var(--blue) 15%,transparent)',marginBottom:14}}>
                      <div style={{fontSize:11,fontWeight:700,color:'var(--blue)',marginBottom:8}}>獎金試算</div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:8}}>
                        <div style={{textAlign:'center'}}>
                          <div style={{fontSize:10,color:'var(--tx3)'}}>個人獎金 (2.5%)</div>
                          <div style={{fontFamily:'var(--m)',fontWeight:700,fontSize:14}}>{fmt(personalBonus)}</div>
                          <div style={{fontSize:10,color:'var(--tx3)'}}>{assignees.map((a:string)=>STAFF_MAP[a]||a).join('、')}</div>
                        </div>
                        <div style={{textAlign:'center'}}>
                          <div style={{fontSize:10,color:'var(--tx3)'}}>組長控案 (1.5%)</div>
                          <div style={{fontFamily:'var(--m)',fontWeight:700,fontSize:14}}>{fmt(leaderBonus)}</div>
                          <div style={{fontSize:10,color:'var(--tx3)'}}>{STAFF_MAP[LEADER_MAP[selCase.team]]||LEADER_MAP[selCase.team]}</div>
                        </div>
                        <div style={{textAlign:'center'}}>
                          <div style={{fontSize:10,color:'var(--tx3)'}}>團體獎金池 (3%)</div>
                          <div style={{fontFamily:'var(--m)',fontWeight:700,fontSize:14}}>{fmt(teamPool)}</div>
                        </div>
                      </div>
                      {isNonLeading && (
                        <div style={{fontSize:11,color:'#b45309',borderTop:'1px solid var(--bd)',paddingTop:6,marginTop:4}}>
                          非領銜公司分紅 (30%)：{fmt(companyShare)}（已從計算基礎扣除）
                        </div>
                      )}
                      {extraBonus && (
                        <div style={{fontSize:11,color:'var(--tx2)',marginTop:4}}>
                          ＋ 加碼獎金 {fmt(parseFloat(extraBonus))} → {extraBonusTarget || '未指定'}
                        </div>
                      )}
                      <div style={{fontSize:12,fontWeight:700,borderTop:'1px solid var(--bd)',paddingTop:6,marginTop:6,display:'flex',justifyContent:'space-between'}}>
                        <span style={{color:'var(--tx2)'}}>本次獎金總額</span>
                        <span style={{fontFamily:'var(--m)',color:'var(--blue)'}}>{fmt(personalBonus*assignees.length + leaderBonus + teamPool + (parseFloat(extraBonus)||0))}</span>
                      </div>
                    </div>
                  )
                })()}

                <div style={{display:'flex',justifyContent:'flex-end'}}>
                  <button className="btn btn-primary" onClick={handleIssue} disabled={saving}>
                    {saving ? '開立中…' : '✓ 開立收據'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 已開立清單 ── */}
        {activeTab==='list' && (
          <div style={{padding:'16px 24px'}}>
            <div style={{display:'flex',gap:8,marginBottom:14}}>
              <input className="search-input" placeholder="搜尋案件或收據號碼…" value={listSearch} onChange={e=>setListSearch(e.target.value)} />
              <select className="fi" style={{width:130}} value={listStatus} onChange={e=>setListStatus(e.target.value)}>
                <option value="">全部狀態</option>
                <option>請款中</option><option>請款中列獎金</option><option>已收款</option>
              </select>
            </div>

            {/* 表頭 */}
            <div style={{display:'grid',gridTemplateColumns:'120px 110px 120px 90px 110px 80px 100px 1fr 40px',gap:0,padding:'6px 12px',borderBottom:'2px solid var(--bd)',background:'var(--bgh)'}}>
              {['案件名稱','委託單位','收據號碼','開立日期','付款狀態','收款日期','開立期款','備註',''].map((h,i)=>(
                <span key={i} style={{fontSize:10,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase'}}>{h}</span>
              ))}
            </div>

            {filteredReceipts.length===0 ? (
              <div style={{padding:'40px 0',textAlign:'center',color:'var(--tx3)'}}>尚無已開立收據</div>
            ) : filteredReceipts.map(r=>{
              const c = cases.find(x=>x.id===r.caseId)
              const isEditing = editingId===r.id
              return (
                <div key={r.id} style={{display:'grid',gridTemplateColumns:'120px 110px 120px 90px 110px 80px 100px 1fr 40px',alignItems:'center',gap:0,padding:'9px 12px',borderBottom:'1px solid var(--bd)',background:'var(--bgc)',fontSize:12}}>
                  <span style={{fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.caseName||c?.name||'—'}</span>
                  <span style={{color:'var(--tx2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c?.clientName||'—'}</span>
                  <span style={{fontFamily:'var(--m)',fontWeight:600}}>{r.receiptNo||'—'}</span>
                  <span style={{color:'var(--tx2)'}}>{fd(r.invoiceDate)}</span>
                  <span style={{
                    fontSize:10,padding:'2px 6px',borderRadius:3,display:'inline-block',
                    background:(statusColor[r.status]||'#6b7280')+'20',color:statusColor[r.status]||'var(--tx3)'
                  }}>{r.status||'—'}</span>
                  <span style={{color:'var(--tx2)'}}>{fd(r.receivedDate)}</span>
                  <span style={{color:'var(--tx2)'}}>{r.period||'—'}</span>
                  {isEditing ? (
                    <input className="fi" style={{fontSize:11,padding:'2px 6px'}} defaultValue={r.notes||''} id={`note-${r.id}`} />
                  ) : (
                    <span style={{color:'var(--tx3)',fontSize:11,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.notes||'—'}</span>
                  )}
                  <div style={{display:'flex',gap:3}}>
                    {isEditing ? (
                      <button className="btn btn-sm btn-primary" style={{fontSize:10,padding:'2px 5px'}}
                        onClick={async()=>{
                          const el = document.getElementById(`note-${r.id}`) as HTMLInputElement
                          await fetch('/api/payments',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:r.id,notes:el?.value||''})})
                          const p = await fetch('/api/payments').then(x=>x.json())
                          setPayments(Array.isArray(p)?p:[])
                          setEditingId(null)
                        }}>✓</button>
                    ) : (
                      <button className="btn btn-sm" style={{fontSize:10,padding:'2px 5px',opacity:.6}} onClick={()=>setEditingId(r.id)}>編輯</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── 獎金分配 ── */}
        {activeTab==='bonus' && (
          <div style={{padding:'16px 24px'}}>
            <div style={{fontSize:11,color:'var(--tx3)',marginBottom:16}}>
              僅顯示狀態為「請款中列獎金」或「已收款」的款項。個人 2.5% / 組長控案 1.5% / 團體獎金池 3%
            </div>
            {['妮組','文組'].map(team=>{
              const rows = bonusByTeam[team] || []
              if (rows.length===0) return null
              const totalBase = rows.reduce((s:number,r:any)=>s+(r.receivedAmount||r.amount||0),0)
              const isNonLeading = (r:any) => r.case?.leadingTypeField==='非領銜'
              const totalPersonal = rows.reduce((s:number,r:any)=>{
                const amt=r.receivedAmount||r.amount||0; const base=isNonLeading(r)?amt*0.7:amt
                return s+base*0.025
              },0)
              const totalLeader = rows.reduce((s:number,r:any)=>{
                const amt=r.receivedAmount||r.amount||0; const base=isNonLeading(r)?amt*0.7:amt
                return s+base*0.015
              },0)
              const totalPool = rows.reduce((s:number,r:any)=>{
                const amt=r.receivedAmount||r.amount||0; const base=isNonLeading(r)?amt*0.7:amt
                return s+base*0.03
              },0)
              const totalCompany = rows.filter((r:any)=>isNonLeading(r)).reduce((s:number,r:any)=>s+(r.receivedAmount||r.amount||0)*0.3,0)

              return (
                <div key={team} style={{marginBottom:24,borderRadius:10,border:'1px solid var(--bd)',overflow:'hidden'}}>
                  {/* 組標題 */}
                  <div style={{padding:'12px 16px',background:'var(--bgh)',borderBottom:'1px solid var(--bd)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontWeight:800,fontSize:15}}>{team}</span>
                    <div style={{display:'flex',gap:20,fontSize:12}}>
                      <span><span style={{color:'var(--tx3)'}}>個人獎金</span> <b style={{fontFamily:'var(--m)',color:'var(--blue)'}}>{fmt(totalPersonal)}</b></span>
                      <span><span style={{color:'var(--tx3)'}}>組長控案</span> <b style={{fontFamily:'var(--m)'}}>{fmt(totalLeader)}</b></span>
                      <span><span style={{color:'var(--tx3)'}}>獎金池</span> <b style={{fontFamily:'var(--m)',color:'#16a34a'}}>{fmt(totalPool)}</b></span>
                      {totalCompany>0&&<span><span style={{color:'var(--tx3)'}}>公司分紅</span> <b style={{fontFamily:'var(--m)',color:'#b45309'}}>{fmt(totalCompany)}</b></span>}
                    </div>
                  </div>

                  {/* 款項明細 */}
                  {rows.map((r:any)=>{
                    const amt=r.receivedAmount||r.amount||0
                    const base=isNonLeading(r)?amt*0.7:amt
                    const assignees=r.case?.assignees||[]
                    return (
                      <div key={r.id} style={{padding:'10px 16px',borderBottom:'1px solid var(--bd)',display:'grid',gridTemplateColumns:'1fr 90px 90px 90px 90px',gap:8,alignItems:'center'}}>
                        <div>
                          <div style={{fontWeight:600,fontSize:12}}>{r.caseName||'—'} <span style={{fontWeight:400,color:'var(--tx3)'}}>· {r.period||''}</span></div>
                          <div style={{fontSize:10,color:'var(--tx3)'}}>
                            {assignees.map((a:string)=>STAFF_MAP[a]||a).join('、')}
                            {isNonLeading(r)&&<span style={{color:'#b45309',marginLeft:4}}>非領銜</span>}
                          </div>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontSize:10,color:'var(--tx3)'}}>收款額</div>
                          <div style={{fontFamily:'var(--m)',fontSize:12}}>{fmt(amt)}</div>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontSize:10,color:'var(--tx3)'}}>個人/人</div>
                          <div style={{fontFamily:'var(--m)',fontSize:12,color:'var(--blue)'}}>{fmt(base*0.025/Math.max(assignees.length,1))}</div>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontSize:10,color:'var(--tx3)'}}>組長</div>
                          <div style={{fontFamily:'var(--m)',fontSize:12}}>{fmt(base*0.015)}</div>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontSize:10,color:'var(--tx3)'}}>獎金池</div>
                          <div style={{fontFamily:'var(--m)',fontSize:12,color:'#16a34a'}}>{fmt(base*0.03)}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
