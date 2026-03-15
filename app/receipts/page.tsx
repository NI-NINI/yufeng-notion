'use client'
import { useEffect, useState, useMemo, Suspense } from 'react'
import Sidebar from '@/components/Sidebar'

// ── 收據號碼自動產生 RC-YYYYMM-NNN ──
function genReceiptNo(existing: string[]): string {
  const now = new Date()
  const pfx = `RC-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}-`
  const nums = existing.filter(s=>s?.startsWith(pfx)).map(s=>parseInt(s.slice(pfx.length))||0)
  return pfx + String(Math.max(0,...nums)+1).padStart(3,'0')
}

const fd = (d:string) => { if(!d) return '—'; const t=new Date(d); return `${t.getFullYear()}/${t.getMonth()+1}/${t.getDate()}` }
const fmt = (n:number|null|undefined) => n==null?'—':'$'+Math.round(n).toLocaleString()

const BONUS_BASE = { personal: 0.025, leader: 0.015, pool: 0.03 }
const LEADER_MAP: Record<string,string> = { '妮組':'黃慈妮', '文組':'徐文靜' }
const STATUS_COLOR: Record<string,string> = { '可請款':'#3D9970', '已請款':'#3A7EC7', '已收款':'#27AE60' }
const STATUS_BG: Record<string,string>    = { '可請款':'#EEF7F2', '已請款':'#EEF3FB', '已收款':'#E8F8EE' }

function StatusTag({ s }: { s: string }) {
  return (
    <span style={{ fontSize:10, padding:'1px 7px', borderRadius:3, fontWeight:600,
      background: STATUS_BG[s]||'rgba(55,53,47,.06)', color: STATUS_COLOR[s]||'#787774' }}>{s||'—'}</span>
  )
}

export default function ReceiptsPage() {
  const [cases, setCases]     = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [tab, setTab]         = useState<'issue'|'list'|'bonus'>('issue')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)

  // 開立表單
  const [search, setSearch]       = useState('')
  const [selCase, setSelCase]     = useState<any>(null)
  const [selPayment, setSelPayment] = useState<any>(null)
  const [receiptNo, setReceiptNo] = useState('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0,10))
  const [payStatus, setPayStatus] = useState('已請款')
  const [receiptNote, setReceiptNote] = useState('')

  // 獎金配發
  const [bonusQuarter, setBonusQuarter] = useState('')
  const [editingNote, setEditingNote]   = useState<string|null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/cases').then(r=>r.json()),
      fetch('/api/payments').then(r=>r.json()),
    ]).then(([c,p]) => {
      setCases(Array.isArray(c)?c:[])
      setPayments(Array.isArray(p)?p:[])
      setLoading(false)
    })
  }, [])

  const reload = () => fetch('/api/payments').then(r=>r.json()).then(p=>setPayments(Array.isArray(p)?p:[]))

  // ── 可請款的案件（收款狀態=可請款 或 案件中有 canInvoice 的款項）──
  const invoicableCases = useMemo(() => {
    const caseIdsWithInvoicable = new Set(
      payments.filter(p => p.canInvoice || p.status==='可請款' || p.status==='未請款')
              .map(p=>p.caseId)
    )
    return cases.filter(c => caseIdsWithInvoicable.has(c.id))
  }, [cases, payments])

  const searchResults = useMemo(() => {
    if (!search.trim()) return invoicableCases.slice(0,8)
    return invoicableCases.filter(c =>
      c.name?.includes(search) || c.clientName?.includes(search) || c.caseNumber?.includes(search)
    ).slice(0,8)
  }, [search, invoicableCases])

  // 選到案件時，過濾出可請款的分期
  const availablePayments = useMemo(() => {
    if (!selCase) return []
    return payments.filter(p =>
      p.caseId===selCase.id && !p.receiptNo  // 尚未開立收據
    )
  }, [selCase, payments])

  // 已開立收據
  const issuedReceipts = useMemo(() =>
    payments.filter(p=>p.receiptNo)
      .sort((a,b)=>(b.invoiceDate||'').localeCompare(a.invoiceDate||''))
  , [payments])

  // 可配發獎金的款項（已請款/已收款，且有收據編號）
  const bonusPayments = useMemo(() =>
    payments.filter(p => {
      if (!p.receiptNo) return false
      const st = p.payStatus || p.status
      if (st !== '已請款' && st !== '已收款' && st !== '請款中列獎金') return false
      if (bonusQuarter && p.bonusQuarterSel !== bonusQuarter) return false
      return true
    })
  , [payments, bonusQuarter])

  // 按組別分群
  const bonusByTeam = useMemo(() => {
    const r: Record<string,{payment:any; case_:any}[]> = { 妮組:[], 文組:[] }
    for (const p of bonusPayments) {
      const c = cases.find(x=>x.id===p.caseId)
      if (!c) continue
      const team = c.team==='妮組' ? '妮組' : '文組'
      r[team].push({ payment:p, case_:c })
    }
    return r
  }, [bonusPayments, cases])

  // 開立收據
  const handleIssue = async () => {
    if (!selPayment) { alert('請選擇期款'); return }
    if (!receiptNo) { alert('請確認收據號碼'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'PATCH',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          id: selPayment.id,
          receiptNo,
          invoiceDate: issueDate,
          status: payStatus,
          payStatus,
          notes: receiptNote,
          canInvoice: true,
        })
      })
      if (!res.ok) { alert('開立失敗'); return }
      await reload()
      alert(`✅ 收據 ${receiptNo} 已開立`)
      setSelCase(null); setSelPayment(null); setSearch('')
      setReceiptNote(''); setPayStatus('已請款')
      setTab('list')
    } finally { setSaving(false) }
  }

  if (loading) return (
    <div className="app"><Sidebar /><div className="main"><div className="loading"><div className="spin"/><span>載入中…</span></div></div></div>
  )

  // ── 計算獎金 ──
  const calcBonus = (amt: number, assignees: string[], team: string, isNonLeading: boolean) => {
    const base = isNonLeading ? amt * 0.7 : amt
    const personal = base * BONUS_BASE.personal / Math.max(assignees.length, 1)
    const leader   = base * BONUS_BASE.leader
    const pool     = base * BONUS_BASE.pool
    const company  = isNonLeading ? amt * 0.3 : 0
    return { base, personal, leader, pool, company }
  }

  const TABS = [{ id:'issue', label:'開立收據' }, { id:'list', label:'已開立清單' }, { id:'bonus', label:'獎金配發' }] as const

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <div className="page-hd">
          <h1>收據開立</h1>
          <div className="page-hd-r">
            {TABS.map(t => (
              <button key={t.id} className={`btn btn-sm ${tab===t.id?'btn-primary':'btn-ghost'}`}
                onClick={()=>setTab(t.id)}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* ── 開立收據 ── */}
        {tab==='issue' && (
          <div style={{ overflowY:'auto', height:'calc(100vh - 48px)', padding:'20px 28px' }}>
            <div style={{ maxWidth:700 }}>

              {/* Step 1: 搜尋可請款案件 */}
              <div style={{ marginBottom:16, border:'1px solid rgba(55,53,47,.09)', borderRadius:8, overflow:'hidden' }}>
                <div style={{ padding:'10px 16px', background:'rgba(55,53,47,.03)', borderBottom:'1px solid rgba(55,53,47,.06)' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#787774', textTransform:'uppercase', letterSpacing:'.04em' }}>① 選擇案件</div>
                </div>
                <div style={{ padding:16 }}>
                  <div style={{ fontSize:11, color:'#787774', marginBottom:8 }}>
                    顯示有分期款項（尚未開立收據）的案件共 <b style={{color:'#37352F'}}>{invoicableCases.length}</b> 件
                  </div>
                  <div className="dd-wrap">
                    <input className="fi" value={search}
                      onChange={e=>{setSearch(e.target.value);setSelCase(null);setSelPayment(null)}}
                      placeholder="搜尋案件名稱、委託單位…" />
                    {(search || !selCase) && searchResults.length > 0 && (
                      <div className="dd" style={{ maxHeight:240 }}>
                        {searchResults.map(c => (
                          <div key={c.id} className="dd-opt"
                            onClick={()=>{setSelCase(c); setSearch(c.name||''); setSelPayment(null)}}>
                            <div>
                              <div style={{ fontWeight:600, fontSize:13 }}>{c.name||'—'}</div>
                              <div style={{ fontSize:10, color:'#787774' }}>{c.clientName} · {c.team} · {c.status}</div>
                            </div>
                            <div style={{ fontFamily:'var(--m)', fontSize:12, color:'#37352F' }}>
                              {fmt(c.contractAmount)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 案件摘要卡 */}
                  {selCase && (
                    <div style={{ marginTop:12, padding:'10px 14px', borderRadius:6, background:'rgba(55,53,47,.03)', border:'1px solid rgba(55,53,47,.08)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:14 }}>{selCase.name}</div>
                          <div style={{ fontSize:11, color:'#787774', marginTop:2 }}>{selCase.clientName} · {selCase.team} · {selCase.status}</div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontSize:10, color:'#787774' }}>服務費用</div>
                          <div style={{ fontFamily:'var(--m)', fontWeight:700 }}>{fmt(selCase.contractAmount)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: 選期款 */}
              {selCase && (
                <div style={{ marginBottom:16, border:'1px solid rgba(55,53,47,.09)', borderRadius:8, overflow:'hidden' }}>
                  <div style={{ padding:'10px 16px', background:'rgba(55,53,47,.03)', borderBottom:'1px solid rgba(55,53,47,.06)' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#787774', textTransform:'uppercase', letterSpacing:'.04em' }}>② 選擇期款</div>
                  </div>
                  <div style={{ padding:16 }}>
                    {availablePayments.length === 0 ? (
                      <div style={{ fontSize:12, color:'#787774', padding:'8px 0' }}>
                        此案件尚無分期款項，請先至「案件建立」設定費用分期
                      </div>
                    ) : availablePayments.map(p => (
                      <label key={p.id} style={{
                        display:'flex', alignItems:'center', gap:12, padding:'10px 12px',
                        borderRadius:6, cursor:'pointer', marginBottom:6,
                        border:`1.5px solid ${selPayment?.id===p.id?'#3A7EC7':'rgba(55,53,47,.09)'}`,
                        background: selPayment?.id===p.id ? '#EEF3FB' : '#fff',
                        transition: 'all .1s'
                      }}>
                        <input type="radio" style={{ accentColor:'#3A7EC7' }}
                          checked={selPayment?.id===p.id}
                          onChange={()=>{
                            setSelPayment(p)
                            const allNos = payments.map((x:any)=>x.receiptNo).filter(Boolean)
                            setReceiptNo(genReceiptNo(allNos))
                          }} />
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <span style={{ fontWeight:600, fontSize:13 }}>{p.period || '期款'}</span>
                            <span style={{ fontFamily:'var(--m)', fontWeight:700 }}>{fmt(p.amount)}</span>
                          </div>
                          <div style={{ display:'flex', gap:8, marginTop:4, alignItems:'center' }}>
                            {p.ratePct && <span style={{ fontSize:10, color:'#787774' }}>{p.ratePct}%</span>}
                            <StatusTag s={p.status||'未請款'} />
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: 收據資訊 */}
              {selPayment && (
                <div style={{ border:'1px solid rgba(55,53,47,.09)', borderRadius:8, overflow:'hidden' }}>
                  <div style={{ padding:'10px 16px', background:'rgba(55,53,47,.03)', borderBottom:'1px solid rgba(55,53,47,.06)' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#787774', textTransform:'uppercase', letterSpacing:'.04em' }}>③ 填寫收據資訊</div>
                  </div>
                  <div style={{ padding:16, display:'flex', flexDirection:'column', gap:12 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      <div className="fg">
                        <label>收據號碼 <span style={{fontWeight:400,color:'#787774'}}>(可修改)</span></label>
                        <input className="fi" value={receiptNo} onChange={e=>setReceiptNo(e.target.value)}
                          style={{ fontFamily:'var(--m)', fontWeight:600 }} />
                      </div>
                      <div className="fg">
                        <label>開立日期</label>
                        <input type="date" className="fi" value={issueDate} onChange={e=>setIssueDate(e.target.value)} />
                      </div>
                    </div>

                    <div className="fg">
                      <label>狀態</label>
                      <div style={{ display:'flex', gap:6 }}>
                        {['已請款','已收款'].map(s=>(
                          <button key={s} onClick={()=>setPayStatus(s)}
                            style={{ flex:1, padding:'7px', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:600,
                              border:`1.5px solid ${payStatus===s?(STATUS_COLOR[s]||'#3A7EC7'):'rgba(55,53,47,.09)'}`,
                              background: payStatus===s ? (STATUS_BG[s]||'#EEF3FB') : '#fff',
                              color: payStatus===s ? (STATUS_COLOR[s]||'#37352F') : '#787774'
                            }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="fg">
                      <label>備註</label>
                      <textarea className="dp-note" style={{ minHeight:48 }} value={receiptNote}
                        onChange={e=>setReceiptNote(e.target.value)} />
                    </div>

                    {/* 獎金試算預覽 */}
                    {selCase && (() => {
                      const amt = selPayment.amount || 0
                      const assignees = selCase.assignees || []
                      const isNL = selCase.leadingTypeField==='非領銜'
                      const b = calcBonus(amt, assignees, selCase.team, isNL)
                      return (
                        <div style={{ padding:12, borderRadius:6, background:'rgba(58,126,199,.05)', border:'1px solid rgba(58,126,199,.15)' }}>
                          <div style={{ fontSize:11, fontWeight:700, color:'#3A7EC7', marginBottom:8 }}>獎金試算（僅供參考，開立後於獎金配發頁確認）</div>
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                            {[
                              { label:`個人獎金/人 (2.5%)`, val: b.personal, sub: assignees.slice(0,3).map((a:string)=>a[0]).join('、') },
                              { label:`組長控案 (1.5%)`, val: b.leader, sub: LEADER_MAP[selCase.team]?.[0] || '—' },
                              { label:`獎金池 (3%)`, val: b.pool, sub: selCase.team },
                            ].map(({label,val,sub})=>(
                              <div key={label} style={{ textAlign:'center' }}>
                                <div style={{ fontSize:10, color:'#787774' }}>{label}</div>
                                <div style={{ fontFamily:'var(--m)', fontWeight:700, fontSize:14 }}>{fmt(val)}</div>
                                <div style={{ fontSize:10, color:'#787774' }}>{sub}</div>
                              </div>
                            ))}
                          </div>
                          {isNL && (
                            <div style={{ marginTop:8, fontSize:11, color:'#C08C30', borderTop:'1px solid rgba(55,53,47,.06)', paddingTop:6 }}>
                              非領銜公司分紅 30%：{fmt(b.company)}（已從計算基礎扣除）
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    <div style={{ display:'flex', justifyContent:'flex-end' }}>
                      <button className="btn btn-primary" onClick={handleIssue} disabled={saving}>
                        {saving ? '開立中…' : '✓ 開立收據'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 已開立清單 ── */}
        {tab==='list' && (
          <div style={{ overflowY:'auto', height:'calc(100vh - 48px)' }}>
            <div style={{ padding:'8px 28px 8px', borderBottom:'1px solid rgba(55,53,47,.09)', fontSize:11, color:'#787774' }}>
              共 <b style={{color:'#37352F'}}>{issuedReceipts.length}</b> 筆已開立收據
            </div>
            <table>
              <thead><tr>
                <th>案件名稱</th><th>委託單位</th><th>收據號碼</th>
                <th>開立日期</th><th>狀態</th><th>期別</th><th>金額</th><th>備註</th>
              </tr></thead>
              <tbody>
                {issuedReceipts.length===0 ? (
                  <tr><td colSpan={8} style={{textAlign:'center',color:'#787774',padding:32}}>尚無已開立收據</td></tr>
                ) : issuedReceipts.map(r => {
                  const c = cases.find(x=>x.id===r.caseId)
                  const isEditing = editingNote===r.id
                  return (
                    <tr key={r.id} style={{ cursor:'default' }}>
                      <td style={{ fontWeight:600 }}>{r.caseName||c?.name||'—'}</td>
                      <td className="muted">{c?.clientName||'—'}</td>
                      <td style={{ fontFamily:'var(--m)', fontWeight:600, fontSize:12 }}>{r.receiptNo}</td>
                      <td className="muted">{fd(r.invoiceDate)}</td>
                      <td><StatusTag s={r.payStatus||r.status||'—'} /></td>
                      <td className="muted">{r.period||'—'}</td>
                      <td style={{ fontFamily:'var(--m)', fontSize:12 }}>{fmt(r.amount)}</td>
                      <td>
                        {isEditing ? (
                          <div style={{ display:'flex', gap:4 }}>
                            <input className="fi" id={`note-${r.id}`} defaultValue={r.notes||''} style={{ fontSize:11, padding:'2px 6px' }} />
                            <button className="btn btn-sm btn-primary" onClick={async()=>{
                              const el = document.getElementById(`note-${r.id}`) as HTMLInputElement
                              await fetch('/api/payments',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:r.id,notes:el?.value||''})})
                              await reload(); setEditingNote(null)
                            }}>✓</button>
                          </div>
                        ) : (
                          <span style={{ color:'#787774', fontSize:11, cursor:'pointer' }}
                            onClick={()=>setEditingNote(r.id)}>
                            {r.notes||<span style={{color:'rgba(55,53,47,.3)'}}>點擊編輯</span>}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 獎金配發 ── */}
        {tab==='bonus' && (
          <div style={{ overflowY:'auto', height:'calc(100vh - 48px)', padding:'16px 28px' }}>
            {/* 季度篩選 */}
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              <div style={{ fontSize:12, color:'#787774' }}>篩選季度：</div>
              {['全部','Q1','Q2','Q3','Q4'].map(q=>(
                <button key={q} onClick={()=>setBonusQuarter(q==='全部'?'':q)}
                  style={{ padding:'3px 12px', borderRadius:4, border:'1px solid rgba(55,53,47,.09)', cursor:'pointer',
                    fontSize:11, fontWeight:600,
                    background: (bonusQuarter===q||(q==='全部'&&!bonusQuarter)) ? '#37352F' : '#fff',
                    color:      (bonusQuarter===q||(q==='全部'&&!bonusQuarter)) ? '#fff'    : '#787774'
                  }}>{q}</button>
              ))}
              <span style={{ fontSize:11, color:'#787774', marginLeft:4 }}>
                共 <b style={{color:'#37352F'}}>{bonusPayments.length}</b> 筆可配發
              </span>
            </div>

            {bonusPayments.length===0 ? (
              <div style={{ textAlign:'center', color:'#787774', padding:'60px 0', fontSize:13 }}>
                尚無可配發獎金款項<br/>
                <span style={{ fontSize:11, marginTop:4, display:'block' }}>請先開立收據並將狀態設為「已請款」或「已收款」</span>
              </div>
            ) : ['妮組','文組'].map(team => {
              const rows = bonusByTeam[team] || []
              if (rows.length===0) return null
              const totBase  = rows.reduce((s,{payment:p,case_:c})=>s+(()=>{const a=p.amount||0;return c.leadingTypeField==='非領銜'?a*0.7:a})(),0)
              const totPers  = rows.reduce((s,{payment:p,case_:c})=>s+(()=>{const a=p.amount||0;const b=c.leadingTypeField==='非領銜'?a*0.7:a;return b*BONUS_BASE.personal/Math.max((c.assignees||[]).length,1)})(),0)
              const totLead  = totBase * BONUS_BASE.leader
              const totPool  = totBase * BONUS_BASE.pool
              const totComp  = rows.filter(({case_:c})=>c.leadingTypeField==='非領銜').reduce((s,{payment:p})=>s+(p.amount||0)*0.3,0)

              return (
                <div key={team} style={{ marginBottom:20, border:'1px solid rgba(55,53,47,.09)', borderRadius:8, overflow:'hidden' }}>
                  {/* 組標題 */}
                  <div style={{ padding:'12px 18px', background:'rgba(55,53,47,.03)', borderBottom:'1px solid rgba(55,53,47,.09)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontWeight:800, fontSize:15 }}>{team}</span>
                    <div style={{ display:'flex', gap:20, fontSize:12 }}>
                      <span><span style={{ color:'#787774' }}>個人合計</span> <b style={{ fontFamily:'var(--m)', color:'#3A7EC7' }}>{fmt(totPers)}</b></span>
                      <span><span style={{ color:'#787774' }}>組長控案</span> <b style={{ fontFamily:'var(--m)' }}>{fmt(totLead)}</b></span>
                      <span><span style={{ color:'#787774' }}>獎金池</span> <b style={{ fontFamily:'var(--m)', color:'#27AE60' }}>{fmt(totPool)}</b></span>
                      {totComp>0&&<span><span style={{ color:'#787774' }}>公司分紅</span> <b style={{ fontFamily:'var(--m)', color:'#C08C30' }}>{fmt(totComp)}</b></span>}
                    </div>
                  </div>

                  {/* 款項明細 */}
                  {rows.map(({payment:p, case_:c}) => {
                    const amt = p.amount || 0
                    const isNL = c.leadingTypeField==='非領銜'
                    const base = isNL ? amt*0.7 : amt
                    const b = calcBonus(amt, c.assignees||[], team, isNL)
                    return (
                      <div key={p.id} style={{ display:'grid', gridTemplateColumns:'1fr 90px 90px 90px 90px', gap:8, alignItems:'center', padding:'10px 18px', borderBottom:'1px solid rgba(55,53,47,.06)' }}>
                        <div>
                          <div style={{ fontWeight:600, fontSize:12 }}>{p.caseName||c.name||'—'} <span style={{ fontWeight:400, color:'#787774' }}>· {p.period||''}</span></div>
                          <div style={{ fontSize:10, color:'#787774', marginTop:2 }}>
                            {(c.assignees||[]).map((a:string)=>a[0]).join('、')}
                            {isNL&&<span style={{ color:'#C08C30', marginLeft:4 }}>非領銜</span>}
                            {p.receiptNo&&<span style={{ fontFamily:'var(--m)', marginLeft:6 }}>{p.receiptNo}</span>}
                          </div>
                        </div>
                        <div style={{ textAlign:'right' }}><div style={{ fontSize:10, color:'#787774' }}>收款</div><div style={{ fontFamily:'var(--m)', fontSize:12 }}>{fmt(amt)}</div></div>
                        <div style={{ textAlign:'right' }}><div style={{ fontSize:10, color:'#787774' }}>個人/人</div><div style={{ fontFamily:'var(--m)', fontSize:12, color:'#3A7EC7', fontWeight:700 }}>{fmt(b.personal)}</div></div>
                        <div style={{ textAlign:'right' }}><div style={{ fontSize:10, color:'#787774' }}>組長</div><div style={{ fontFamily:'var(--m)', fontSize:12 }}>{fmt(b.leader)}</div></div>
                        <div style={{ textAlign:'right' }}><div style={{ fontSize:10, color:'#787774' }}>獎金池</div><div style={{ fontFamily:'var(--m)', fontSize:12, color:'#27AE60', fontWeight:700 }}>{fmt(b.pool)}</div></div>
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
