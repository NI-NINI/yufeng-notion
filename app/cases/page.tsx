'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

const TYPES = ['都更前期','都更','法拍','一般件','法院案','買賣','地上權','代金','國產署','合理市場租金參考','容積代金試算','公允價值評估','瑕疵','捷運聯開','危老','權利變換','其他']
const STATUSES = ['未啟動','進行中','等待中','擱淺','覆核中','已完成']
const PRIORITIES = ['特急','優先','普通','緩慢']
const TEAMS = ['妮組','文組','舊案(妮+文)']
// 你現有DB承辦人是全名 select，前端顯示簡稱
const ASSIGNEES: Record<string,string[]> = { 妮組:['慈妮','紘齊','韋萱','黃慈妮','許紘齊','吳韋萱'], 文組:['文靜','Jenny','旭庭','方謙','徐文靜'], 未派:[] }
const ALL_ASSIGNEES = ['慈妮','紘齊','韋萱','文靜','Jenny','旭庭','方謙','黃慈妮','徐文靜','吳韋萱','許紘齊']
// 顯示名稱正規化（全名→簡稱）
const SHORT: Record<string,string> = {'黃慈妮':'慈妮','徐文靜':'文靜','張博宇':'博宇','吳韋萱':'韋萱','許紘齊':'紘齊'}
const displayName = (n:string) => SHORT[n] || n
const APPRAISERS = ['所長','副所','博宇','慈妮','文靜']
const LEADING_TYPES = ['領銜','非領銜','不適用']
const PERIODS = ['第1期','第2期','第3期','第4期','第5期','尾款']

const PC: Record<string,string> = { 慈妮:'#B45309',文靜:'#065F46',紘齊:'#9F1239',韋萱:'#4338CA',Jenny:'#BE185D',旭庭:'#92400E',方謙:'#1E40AF' }
const uc = (n:string) => PC[n]||'#6B6760'

const statusDot = (s:string) => {
  const cls = {進行中:'st-a',覆核中:'st-r',等待中:'st-r',已完成:'st-d',擱淺:'st-s'}
  return <span className={`st ${(cls as any)[s]||''}`}>{s}</span>
}
const typeBadge = (t:string) => {
  const cls = {都更:'tg-mauve',都更前期:'tg-mauve',法拍:'tg-blue',一般件:'tg-muted',國產署:'tg-amber',權利變換:'tg-rose'}
  return <span className={`tg ${(cls as any)[t]||'tg-muted'}`}>{t}</span>
}
const priCls: Record<string,string> = {特急:'tg-rose',優先:'tg-amber',普通:'tg-muted',緩慢:'tg-muted'}
const fmt = (n:number|null|undefined) => n==null?'—':'$'+n.toLocaleString()
const fd = (d:string) => { if(!d) return '—'; const t=new Date(d); return `${t.getMonth()+1}/${t.getDate()}` }
const dl = (d:string) => { if(!d) return null; return Math.ceil((new Date(d).getTime()-Date.now())/864e5) }

const emptyCase = () => ({
  caseNumber:'', name:'', clientId:'', clientName:'', caseType:'', address:'',
  team:'妮組', assignees:[] as string[], appraisers:[] as string[],
  status:'未啟動', isActive:false, isClosed:false,
  priority:'普通', contractAmount:null as number|null, contractAmountText:'',
  dueDate:'', progressNote:'', location:'',
  redFlag:false, redFlagNote:'',
  leadingType:'不適用', leadingFee:null as number|null, leadingFeeNote:'',
})

function CasesInner() {
  const searchParams = useSearchParams()
  const highlightId = searchParams.get('highlight')

  const [cases, setCases] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [fTeam, setFTeam] = useState('')
  const [fType, setFType] = useState('')
  const [fAssignee, setFAssignee] = useState('')
  const [sel, setSel] = useState<any|null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(emptyCase())
  const [saving, setSaving] = useState(false)
  const [fileUploads, setFileUploads] = useState<Record<string,{url:string,name:string,type:string,blockId?:string}[]>>({})
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [clientSearch, setClientSearch] = useState('')
  const [clientDD, setClientDD] = useState(false)
  const [newClientSearch, setNewClientSearch] = useState('')
  const [newClientDD, setNewClientDD] = useState(false)
  // payment rows state per case
  const [payRows, setPayRows] = useState<any[]>([])
  const [savingPay, setSavingPay] = useState(false)
  const [apiError, setApiError] = useState<string>('')

  const loadAll = async () => {
    setLoading(true)
    setApiError('')
    const [cr, clr, pr] = await Promise.all([
      fetch('/api/cases').then(r=>r.json()),
      fetch('/api/clients').then(r=>r.json()),
      fetch('/api/payments').then(r=>r.json()),
    ])
    if (cr?.error) setApiError('案件API錯誤: ' + cr.error)
    else if (clr?.error) setApiError('客戶API錯誤: ' + clr.error)
    setCases(Array.isArray(cr)?cr:[])
    setClients(Array.isArray(clr)?clr:[])
    setPayments(Array.isArray(pr)?pr:[])
    setLoading(false)
  }
  useEffect(() => { loadAll() }, [])

  // auto-open highlight
  useEffect(() => {
    if (highlightId && cases.length > 0) {
      const c = cases.find(x=>x.id===highlightId)
      if (c) { openPanel(c) }
    }
  }, [highlightId, cases])

  const getCasePayments = (caseId:string) => payments.filter(p=>p.caseId===caseId)

  const openPanel = (c:any) => {
    setSel(c)
    const cp = getCasePayments(c.id)
    setPayRows(cp.map(p=>({...p})))
    setClientSearch(c.clientName||'')
    setPanelOpen(true)
    // load existing attachments
    const pid = c.notionPageId || c.id
    if (pid && !fileUploads[pid]) {
      fetch(`/api/upload?casePageId=${pid}`)
        .then(r=>r.json())
        .then((files:any[]) => setFileUploads(prev=>({...prev,[pid]:files})))
        .catch(()=>{})
    }
  }
  const closePanel = () => { setPanelOpen(false); setSel(null) }

  const openNew = () => {
    setEditing(emptyCase())
    setNewClientSearch('')
    setModalOpen(true)
  }

  const saveCase = async () => {
    if (!sel) return
    setSaving(true)
    try {
      const payload = {
        ...sel,
        isActive: sel.status === '進行中',
        isClosed: sel.status === '已完成',
        contractAmountText: sel.contractAmount != null ? String(sel.contractAmount) : (sel.contractAmountText || ''),
      }
      await fetch('/api/cases', { method:'PATCH', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ id:sel.id, ...payload }) })
      await loadAll()
      setPanelOpen(false)
    } finally { setSaving(false) }
  }

  const createNewCase = async () => {
    setSaving(true)
    try {
      const payload = {
        ...editing,
        isActive: editing.status === '進行中',
        isClosed: editing.status === '已完成',
        contractAmountText: editing.contractAmount != null ? String(editing.contractAmount) : '',
      }
      await fetch('/api/cases', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) })
      await loadAll()
      setModalOpen(false)
    } finally { setSaving(false) }
  }

  const savePayRow = async (p:any) => {
    setSavingPay(true)
    try {
      if (p.id && !p.id.startsWith('new')) {
        await fetch('/api/payments', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(p) })
      } else {
        await fetch('/api/payments', { method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            ...p, caseId:sel?.id,
            title:`${sel?.name||''} ${p.period||''}`,
            paymentType:'一般款項'
          })
        })
      }
      await loadAll()
    } finally { setSavingPay(false) }
  }

  const addPayRow = () => {
    const base = sel?.contractAmount||0
    const used = payRows.reduce((s:number,r:any)=>s+(parseFloat(r.ratePct)||0),0)
    setPayRows(prev=>[...prev,{
      id:`new-${Date.now()}`, period:PERIODS[prev.length]||'第1期',
      ratePct: Math.max(0,100-used), amount: Math.round(base*(100-used)/100),
      status:'未請款', receiptNo:''
    }])
  }

  const updatePayRow = (idx:number, field:string, val:any) => {
    setPayRows(prev => prev.map((r,i) => {
      if (i !== idx) return r
      const updated = { ...r, [field]: val }
      if (field === 'ratePct') {
        updated.amount = Math.round((sel?.contractAmount||0) * parseFloat(val||0) / 100)
      }
      return updated
    }))
  }

  const filtered = cases.filter(c => {
    if (search && !c.name.includes(search) && !c.clientName?.includes(search)) return false
    if (fStatus && c.status !== fStatus) return false
    if (fTeam && c.team !== fTeam) return false
    if (fType && c.caseType !== fType) return false
    if (fAssignee && !c.assignees?.includes(fAssignee)) return false
    return true
  })

  const daysClass = (days:number|null) => {
    if (days===null) return ''
    if (days < 0) return 'color:var(--rose);fontWeight:600'
    if (days <= 3) return 'color:var(--rose)'
    return ''
  }

  const clientOpts = clients.filter(c=>c.name.includes(clientSearch))
  const newClientOpts = clients.filter(c=>c.name.includes(newClientSearch))

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <div className="page-hd">
          <h1>案件管理</h1>
          <div className="page-hd-r">
            <input className="search-input" placeholder="搜尋案件…" value={search} onChange={e=>setSearch(e.target.value)} />
            <button className="btn btn-primary btn-sm" onClick={openNew}>＋ 新增</button>
          </div>
        </div>

        <div className="filter-bar">
          <div className="filter-chip">狀態<select value={fStatus} onChange={e=>setFStatus(e.target.value)}><option value="">全部</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
          <div className="filter-chip">組別<select value={fTeam} onChange={e=>setFTeam(e.target.value)}><option value="">全部</option>{TEAMS.map(t=><option key={t}>{t}</option>)}</select></div>
          <div className="filter-chip">類型<select value={fType} onChange={e=>setFType(e.target.value)}><option value="">全部</option>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
          <div style={{borderLeft:'1px solid var(--bdl)',paddingLeft:9,display:'flex',gap:4,alignItems:'center',flexWrap:'wrap'}}>
            <span style={{fontSize:10,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase'}}>承辦</span>
            {ALL_ASSIGNEES.map(a=>(
              <span key={a} className={`tg ${fAssignee===a?'tg-rose':'tg-muted'}`} style={{cursor:'pointer'}}
                onClick={()=>setFAssignee(fAssignee===a?'':a)}>{a}</span>
            ))}
          </div>
        </div>

        {apiError && <div style={{padding:'8px 16px',background:'#fee2e2',color:'#991b1b',fontSize:13,borderRadius:6,margin:'4px 0 8px'}}>⚠️ {apiError}</div>}
        <div className="stat-bar">
          <span>共 <b>{filtered.length}</b> 案</span>
          <span>進行中 <b>{filtered.filter(c=>c.status==='進行中').length}</b></span>
          <span style={{color:'var(--rose)'}}>紅燈 <b>{filtered.filter(c=>c.redFlag).length}</b></span>
          <span style={{marginLeft:'auto',fontFamily:'var(--m)',fontSize:11}}>
            簽約總額 <b>${filtered.reduce((s,c)=>s+(c.contractAmount||0),0).toLocaleString()}</b>
          </span>
        </div>

        <div className="scroll-area">
          {loading ? <div className="loading"><div className="spin"/><span>載入中…</span></div>
          : filtered.length===0 ? <div className="loading">無符合條件的案件</div>
          : (
            <table>
              <thead><tr>
                <th>#</th><th>類型</th><th>案件名稱</th><th>組別</th>
                <th>承辦</th><th>狀態</th><th>順位</th><th>交件日</th><th>簽約金額</th>
              </tr></thead>
              <tbody>
                {filtered.map(c => {
                  const days = dl(c.dueDate)
                  return (
                    <tr key={c.id} className={c.redFlag?'red-row':''} onClick={()=>openPanel(c)}>
                      <td className="mono muted">{c.caseNumber||'—'}</td>
                      <td>{typeBadge(c.caseType||'其他')}</td>
                      <td>
                        {c.redFlag && <span style={{color:'var(--rose)',fontSize:10,marginRight:4}}>●</span>}
                        <b>{c.name}</b>
                        {c.clientName && <span className="muted" style={{marginLeft:5,fontSize:11}}>{c.clientName}</span>}
                      </td>
                      <td className="muted">{c.team}</td>
                      <td>
                        <div style={{display:'flex',gap:3}}>
                          {(c.assignees||[]).map((a:string)=>(
                            <span key={a} className="av" style={{background:uc(a)}}>{a[0]}</span>
                          ))}
                        </div>
                      </td>
                      <td>{statusDot(c.status)}</td>
                      <td><span className={`tg ${priCls[c.priority]||'tg-muted'}`}>{c.priority}</span></td>
                      <td>
                        {c.dueDate ? (
                          days !== null && days <= 3 ? (
                            <span style={{color:'var(--rose)',fontSize:11,fontWeight:days<0?600:400}}>
                              {days < 0 ? `逾期${Math.abs(days)}天` : `${days}天後`}
                            </span>
                          ) : <span className="muted">{fd(c.dueDate)}</span>
                        ) : <span className="muted">—</span>}
                      </td>
                      <td className="mono">{fmt(c.contractAmount)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ─── DETAIL PANEL ─── */}
      <div className={`dp-overlay ${panelOpen?'open':''}`}>
        <div className="dp-bg" onClick={closePanel}/>
        {sel && (
          <div className="dp">
            <div className="dp-hd">
              <div>
                <div style={{fontSize:11,color:'var(--tx3)',fontFamily:'var(--m)'}}>#{sel.caseNumber} · {sel.caseType} · {sel.team}</div>
              </div>
              <div style={{display:'flex',gap:6}}>
                <button className="btn btn-primary btn-sm" onClick={saveCase} disabled={saving}>{saving?'…':'儲存'}</button>
                <button className="dp-close" onClick={closePanel}>✕</button>
              </div>
            </div>
            <div className="dp-body">
              {/* 案件名稱 */}
              <div style={{marginBottom:14}}>
                <input style={{fontSize:18,fontWeight:700,border:'none',background:'transparent',width:'100%',outline:'none',color:'var(--tx)'}}
                  value={sel.name||''} onChange={e=>setSel((p:any)=>({...p,name:e.target.value}))} />
              </div>

              <div className="dp-g">
                <div className="dp-gl">類型</div>
                <select className="fi" value={sel.caseType||''} onChange={e=>setSel((p:any)=>({...p,caseType:e.target.value}))}>
                  <option value="">—</option>{TYPES.map(t=><option key={t}>{t}</option>)}
                </select>

                <div className="dp-gl">委託方</div>
                <div>
                  <div className="dd-wrap">
                    <input className="fi" value={clientSearch}
                      onChange={e=>{setClientSearch(e.target.value);setClientDD(true)}}
                      onFocus={()=>setClientDD(true)} onBlur={()=>setTimeout(()=>setClientDD(false),200)}
                      placeholder="搜尋客戶…" />
                    {clientDD && clientOpts.length>0 && (
                      <div className="dd">
                        {clientOpts.slice(0,8).map((c:any)=>(
                          <div key={c.id} className="dd-opt" onClick={()=>{
                            setSel((p:any)=>({...p,clientId:c.id,clientName:c.name}))
                            setClientSearch(c.name); setClientDD(false)
                          }}>{c.name} <span className="dd-sub">{c.clientType}</span></div>
                        ))}
                      </div>
                    )}
                  </div>
                  {sel.clientId && <a href="/clients" className="btn btn-sm" style={{marginTop:4,display:'inline-flex'}}>→ 客戶頁</a>}
                </div>

                <div className="dp-gl">組別</div>
                <select className="fi" value={sel.team||''} onChange={e=>setSel((p:any)=>({...p,team:e.target.value,assignees:[]}))}>
                  {TEAMS.map(t=><option key={t}>{t}</option>)}
                </select>

                <div className="dp-gl">承辦</div>
                <div style={{display:'flex',gap:4,flexWrap:'wrap',alignItems:'center'}}>
                  {(sel.assignees||[]).map((a:string)=>(
                    <span key={a} className="tg tg-rose" style={{cursor:'pointer'}} onClick={()=>setSel((p:any)=>({...p,assignees:p.assignees.filter((x:string)=>x!==a)}))}>
                      {a} ✕
                    </span>
                  ))}
                  <select className="fi" style={{width:80,padding:'2px 5px',fontSize:11}} value=""
                    onChange={e=>{if(e.target.value)setSel((p:any)=>{ const prev:string[]=p.assignees||[]; return {...p,assignees:prev.includes(e.target.value)?prev:[...prev,e.target.value]} })}}>
                    <option value="">+</option>
                    {['慈妮','紘齊','韋萱','文靜','Jenny','旭庭','方謙'].filter((a:string)=>!sel.assignees?.includes(a)).map((a:string)=><option key={a}>{a}</option>)}
                  </select>
                </div>

                <div className="dp-gl">簽證估價師</div>
                <div style={{display:'flex',gap:4,flexWrap:'wrap',alignItems:'center'}}>
                  {(sel.appraisers||[]).map((a:string)=>(
                    <span key={a} className="tg tg-blue" style={{cursor:'pointer'}} onClick={()=>setSel((p:any)=>({...p,appraisers:(p.appraisers||[]).filter((x:string)=>x!==a)}))}>
                      {a} ✕
                    </span>
                  ))}
                  <select className="fi" style={{width:80,padding:'2px 5px',fontSize:11}} value=""
                    onChange={e=>{if(e.target.value)setSel((p:any)=>{ const prev:string[]=p.appraisers||[]; return {...p,appraisers:prev.includes(e.target.value)?prev:[...prev,e.target.value]} })}}>
                    <option value="">+</option>
                    {APPRAISERS.filter((a:string)=>!(sel.appraisers||[]).includes(a)).map((a:string)=><option key={a}>{a}</option>)}
                  </select>
                </div>

                <div className="dp-gl">狀態</div>
                <select className="fi" value={sel.status||''} onChange={e=>setSel((p:any)=>({...p,status:e.target.value}))}>
                  {STATUSES.map(s=><option key={s}>{s}</option>)}
                </select>

                <div className="dp-gl">順位</div>
                <select className="fi" value={sel.priority||''} onChange={e=>setSel((p:any)=>({...p,priority:e.target.value}))}>
                  {PRIORITIES.map(p=><option key={p}>{p}</option>)}
                </select>

                <div className="dp-gl">交件日</div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <input type="date" className="fi" style={{width:'auto'}} value={sel.dueDate||''} onChange={e=>setSel((p:any)=>({...p,dueDate:e.target.value}))} />
                  {sel.dueDate && dl(sel.dueDate) !== null && dl(sel.dueDate)! <= 3 && (
                    <span className="tg tg-rose" style={{fontSize:10}}>
                      {dl(sel.dueDate)! < 0 ? `逾期${Math.abs(dl(sel.dueDate)!)}天` : `${dl(sel.dueDate)}天後`}
                    </span>
                  )}
                </div>

                <div className="dp-gl">簽約金額</div>
                <div style={{display:'flex',alignItems:'center',gap:5}}>
                  <span className="muted">$</span>
                  <input type="number" className="fi" style={{width:130,textAlign:'right',fontFamily:'var(--m)'}}
                    value={sel.contractAmount||''} onChange={e=>setSel((p:any)=>({...p,contractAmount:parseFloat(e.target.value)||null}))} />
                </div>
              </div>

              {/* 業務紅燈 */}
              <div className={`flag-row ${sel.redFlag?'on':''}`}>
                <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'}}>
                  <input type="checkbox" checked={sel.redFlag||false} onChange={e=>setSel((p:any)=>({...p,redFlag:e.target.checked}))} />
                  業務紅燈
                </label>
                <input className="fi" style={{flex:1}} placeholder="紅燈原因…"
                  value={sel.redFlagNote||''} onChange={e=>setSel((p:any)=>({...p,redFlagNote:e.target.value}))} />
              </div>

              {/* 領銜設定 */}
              {(sel.caseType==='都更'||sel.caseType==='都更前期'||sel.caseType==='權利變換') && (
                <div className="sec">
                  <div className="sec-hd"><h3>領銜設定</h3></div>
                  <div className="sec-body">
                    <div className="lt-toggle">
                      {LEADING_TYPES.map(t=>(
                        <button key={t} className={`lt-btn ${sel.leadingType===t?'active':''}`}
                          onClick={()=>setSel((p:any)=>({...p,leadingType:t}))}>{t}</button>
                      ))}
                    </div>

                    {sel.leadingType==='領銜' && (
                      <div>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                          <span style={{fontSize:11,fontWeight:600,color:'var(--tx2)'}}>領銜費總額 $</span>
                          <input className="fi" type="number" style={{width:120,textAlign:'right',fontFamily:'var(--m)'}}
                            value={sel.leadingFee||''} onChange={e=>setSel((p:any)=>({...p,leadingFee:parseFloat(e.target.value)||null}))} />
                        </div>
                        {sel.leadingFee && (
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                            {[1,2].map(period=>(
                              <div key={period} style={{border:'1px solid var(--bd)',borderRadius:6,padding:10}}>
                                <div style={{fontSize:11,fontWeight:600,marginBottom:5}}>第{period}期（50%）</div>
                                <div style={{fontFamily:'var(--m)',fontSize:16,fontWeight:700,marginBottom:7}}>
                                  ${Math.round(sel.leadingFee/2).toLocaleString()}
                                </div>
                                <div style={{fontSize:10,color:'var(--tx3)'}}>付款記錄在「付款管理」頁設定</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {sel.leadingType==='非領銜' && (
                      <div style={{border:'1px solid var(--bd)',borderRadius:6,padding:10}}>
                        <div style={{fontSize:12,color:'var(--tx2)',marginBottom:4}}>
                          作業獎金 70%：<b style={{fontFamily:'var(--m)'}}>${Math.round((sel.contractAmount||0)*0.7).toLocaleString()}</b>
                        </div>
                        <div style={{fontSize:12,color:'var(--amber)',marginBottom:8}}>
                          全公司三成池 30%：<b style={{fontFamily:'var(--m)'}}>${Math.round((sel.contractAmount||0)*0.3).toLocaleString()}</b>
                        </div>
                        <div className="fg"><label>業務人員</label><input className="fi" style={{width:150}} placeholder="業務姓名" /></div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 分期付款 */}
              <div className="sec">
                <div className="sec-hd">
                  <h3>分期付款</h3>
                  <button className="btn btn-sm" onClick={addPayRow}>+ 新增期別</button>
                </div>
                <div className="sec-body">
                  <div className="pay-hd">
                    <span>期別</span><span>比例</span><span>金額</span><span>狀態</span><span>收據號</span><span/>
                  </div>
                  {payRows.map((p,i)=>(
                    <div key={p.id||i} className={`pay-row ${p.status==='已收款'?'received':p.status==='可請款'?'invoiceable':''}`}>
                      <select className="fi" style={{padding:'2px 4px',fontSize:11}} value={p.period||''}
                        onChange={e=>updatePayRow(i,'period',e.target.value)}>
                        {PERIODS.map(pd=><option key={pd}>{pd}</option>)}
                      </select>
                      <div style={{display:'flex',alignItems:'center',gap:2}}>
                        <input style={{border:'1px solid var(--bd)',borderRadius:4,padding:'2px 4px',width:42,textAlign:'right',fontFamily:'var(--m)',fontSize:12,outline:'none',background:'var(--bgc)'}}
                          type="number" value={p.ratePct||''} onChange={e=>updatePayRow(i,'ratePct',e.target.value)} />
                        <span style={{fontSize:10,color:'var(--tx3)'}}>%</span>
                      </div>
                      <span style={{fontFamily:'var(--m)',fontSize:13,fontWeight:700}}>
                        ${(p.amount||0).toLocaleString()}
                      </span>
                      <select className="fi" style={{padding:'2px 4px',fontSize:11}} value={p.status||'未請款'}
                        onChange={e=>updatePayRow(i,'status',e.target.value)}>
                        {['未請款','可請款','已請款','已收款'].map(s=><option key={s}>{s}</option>)}
                      </select>
                      <input style={{border:'1px solid var(--bd)',borderRadius:4,padding:'2px 5px',width:100,fontSize:11,outline:'none',fontFamily:'var(--m)',background:'var(--bgc)'}}
                        placeholder="收據號" value={p.receiptNo||''} onChange={e=>updatePayRow(i,'receiptNo',e.target.value)} />
                      <button style={{width:22,height:22,borderRadius:4,fontSize:12,color:'var(--tx3)',cursor:'pointer'}}
                        onClick={()=>setPayRows(prev=>prev.filter((_,j)=>j!==i))}>✕</button>
                    </div>
                  ))}
                  {payRows.length > 0 && (
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginTop:8}}>
                      <span style={{color:'var(--tx3)'}}>
                        合計 {payRows.reduce((s,r)=>s+(parseFloat(r.ratePct)||0),0).toFixed(0)}%
                        {payRows.reduce((s,r)=>s+(parseFloat(r.ratePct)||0),0)===100 ? ' ✓' : ' ⚠️'}
                      </span>
                      <span style={{color:'var(--tx2)'}}>
                        已實收 <b style={{fontFamily:'var(--m)'}}>
                          ${payRows.filter(r=>r.status==='已收款').reduce((s,r)=>s+(r.amount||0),0).toLocaleString()}
                        </b>
                      </span>
                    </div>
                  )}
                  <div style={{marginTop:10,display:'flex',justifyContent:'flex-end'}}>
                    <button className="btn btn-primary btn-sm" onClick={()=>Promise.all(payRows.map(savePayRow))} disabled={savingPay}>
                      {savingPay?'儲存中…':'同步付款記錄'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 備註 */}
              <div style={{marginBottom:10}}>
                <div style={{fontSize:10,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:5}}>進度備註</div>
                <textarea className="dp-note" value={sel.progressNote||''} onChange={e=>setSel((p:any)=>({...p,progressNote:e.target.value}))} />
              </div>
              <div style={{marginBottom:14}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
                  <span style={{fontSize:10,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.05em'}}>文件備註</span>
                  {sel.documentNotes && <span className="tg tg-amber" style={{fontSize:10}}>注意</span>}
                </div>
                <textarea className={`dp-note ${sel.documentNotes?'warn':''}`}
                  value={sel.documentNotes||''} onChange={e=>setSel((p:any)=>({...p,documentNotes:e.target.value}))} />
              </div>

              {/* 附件上傳 */}
              {sel.id && (() => {
                const pid = sel.id
                const attachments = fileUploads[pid] || []
                return (
                  <div style={{marginBottom:14}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                      <span style={{fontSize:10,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.05em'}}>附件（合約 / 報價單）</span>
                      <button className="btn btn-sm" onClick={()=>fileInputRef.current?.click()} disabled={uploading}>
                        {uploading ? '上傳中…' : '＋ 上傳'}
                      </button>
                      <input ref={fileInputRef} type="file" accept=".pdf,image/*" style={{display:'none'}} multiple
                        onChange={async e=>{
                          const files = Array.from(e.target.files||[])
                          if(!files.length) return
                          setUploading(true)
                          try {
                            for(const file of files){
                              const fd2 = new FormData()
                              fd2.append('file', file)
                              fd2.append('casePageId', pid)
                              fd2.append('label', file.name)
                              const r = await fetch('/api/upload',{method:'POST',body:fd2})
                              const d = await r.json()
                              if(d.url){
                                setFileUploads(prev=>({...prev,[pid]:[...(prev[pid]||[]),{url:d.url,name:file.name,type:file.type}]}))
                              }
                            }
                          } finally { setUploading(false); if(fileInputRef.current) fileInputRef.current.value='' }
                        }}
                      />
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:5}}>
                      {attachments.map((f,i)=>(
                        <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',background:'var(--bgc)',border:'1px solid var(--bd)',borderRadius:5}}>
                          <span style={{fontSize:15}}>{f.type?.startsWith('image/')?'🖼️':'📄'}</span>
                          <a href={f.url} target="_blank" rel="noreferrer"
                            style={{flex:1,fontSize:12,color:'var(--blue)',textDecoration:'none',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {f.name||'附件'}
                          </a>
                          {f.blockId && (
                            <button style={{fontSize:11,color:'var(--tx3)',cursor:'pointer',padding:'1px 5px',border:'none',background:'none'}}
                              onClick={async()=>{
                                await fetch('/api/upload',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({blockId:f.blockId})})
                                setFileUploads(prev=>({...prev,[pid]:(prev[pid]||[]).filter((_,idx)=>idx!==i)}))
                              }}>✕</button>
                          )}
                        </div>
                      ))}
                      {!attachments.length && (
                        <div style={{fontSize:12,color:'var(--tx3)',padding:'8px 0',textAlign:'center'}}>尚無附件 — 支援 PDF / 圖片</div>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </div>

      {/* ─── NEW CASE MODAL ─── */}
      <div className={`mo-overlay ${modalOpen?'open':''}`} onClick={e=>{if(e.target===e.currentTarget)setModalOpen(false)}}>
        <div className="mo">
          <div className="mo-hd"><h2>新增案件</h2><button className="dp-close" onClick={()=>setModalOpen(false)}>✕</button></div>
          <div className="mo-body">
            <div className="row2">
              <div className="fg"><label>案件名稱 *</label><input className="fi" value={editing.name||''} onChange={e=>setEditing((p:any)=>({...p,name:e.target.value}))} /></div>
              <div className="fg"><label>類型</label>
                <select className="fi" value={editing.caseType||''} onChange={e=>setEditing((p:any)=>({...p,caseType:e.target.value}))}>
                  <option value="">—</option>{TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="fg">
              <label>委託單位</label>
              <div className="dd-wrap">
                <input className="fi" value={newClientSearch}
                  onChange={e=>{setNewClientSearch(e.target.value);setNewClientDD(true)}}
                  onFocus={()=>setNewClientDD(true)} onBlur={()=>setTimeout(()=>setNewClientDD(false),200)}
                  placeholder="搜尋客戶名稱…" />
                {newClientDD && newClientOpts.length>0 && (
                  <div className="dd">
                    {newClientOpts.slice(0,8).map((c:any)=>(
                      <div key={c.id} className="dd-opt" onClick={()=>{
                        setEditing((p:any)=>({...p,clientId:c.id,clientName:c.name}))
                        setNewClientSearch(c.name); setNewClientDD(false)
                      }}>{c.name} <span className="dd-sub">{c.clientType}</span></div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="row2">
              <div className="fg"><label>組別</label>
                <select className="fi" value={editing.team||'妮組'} onChange={e=>setEditing((p:any)=>({...p,team:e.target.value,assignees:[]}))}>
                  {TEAMS.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="fg"><label>順位</label>
                <select className="fi" value={editing.priority||'普通'} onChange={e=>setEditing((p:any)=>({...p,priority:e.target.value}))}>
                  {PRIORITIES.map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="row2">
              <div className="fg"><label>派件日</label><input type="date" className="fi" value={editing.assignDate||''} onChange={e=>setEditing((p:any)=>({...p,assignDate:e.target.value}))} /></div>
              <div className="fg"><label>預計交件日</label><input type="date" className="fi" value={editing.dueDate||''} onChange={e=>setEditing((p:any)=>({...p,dueDate:e.target.value}))} /></div>
            </div>
            <div className="fg"><label>簽約金額</label><input type="number" className="fi" value={editing.contractAmount||''} onChange={e=>setEditing((p:any)=>({...p,contractAmount:parseFloat(e.target.value)||null}))} /></div>
          </div>
          <div className="mo-ft">
            <button className="btn btn-ghost" onClick={()=>setModalOpen(false)}>取消</button>
            <button className="btn btn-primary" onClick={createNewCase} disabled={saving}>{saving?'建立中…':'建立'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CasesPage() {
  return <Suspense fallback={<div className="loading"><div className="spin"/></div>}><CasesInner /></Suspense>
}
