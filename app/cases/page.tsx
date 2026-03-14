'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

const TYPES = ['都更前期','都更','法拍','一般件','法院案','買賣','地上權','代金','國產署','合理市場租金參考','容積代金試算','公允價值評估','瑕疵','捷運聯開','危老','權利變換','其他']
const STATUSES = ['未啟動','進行中','等待中','擱淺','覆核中','已完成']
const PRIORITIES = ['特急','優先','普通','緩慢']
const TEAMS = ['妮組','文組','未派']
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
  name:'', clientId:'', clientName:'', caseType:'', address:'',
  team:'妮組', assignees:[] as string[], appraisers:[] as string[],
  status:'未啟動', priority:'普通', contractAmount:null as number|null,
  discountRate:100, contractDate:'', assignDate:'', dueDate:'',
  progressNote:'', documentNotes:'', stuckReason:'',
  redFlag:false, redFlagNote:'',
  leadingType:'不適用', leadingFee:null as number|null, leadingFeeNote:'',
  city:'', district:'', landSection:'', landNo:'', buildingNo:'', doorPlate:'',
  siteVisitDate:'', priceDate:'', staffDoneDate:'', actualDueDate:'',
  zhCount:false, zhCountQty:'1', zhCountCopies:'1',
  zhAbstract:false, zhAbstractQty:'1', zhAbstractCopies:'1',
  zhReport:false, zhReportQty:'1', zhReportCopies:'1',
  zhDigital:false, zhDigitalQty:'1', zhDigitalCopies:'1',
  zhCD:false, zhCDQty:'1', zhCDCopies:'1',
  zhNoSealAbstract:false, zhNoSealAbstractQty:'1', zhNoSealAbstractCopies:'1',
  enCount:false, enCountQty:'1', enCountCopies:'1',
  enAbstract:false, enAbstractQty:'1', enAbstractCopies:'1',
  enReport:false, enReportQty:'1', enReportCopies:'1',
  enDigital:false, enDigitalQty:'1', enDigitalCopies:'1',
  enCD:false, enCDQty:'1', enCDCopies:'1',
  contactIdx:0, contactPhone:'', contactMobile:'',
  caseNotes:'',
})

function subtractWorkdays(dateStr: string, days: number): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  let count = 0
  while (count < days) {
    d.setDate(d.getDate() - 1)
    const day = d.getDay()
    if (day !== 0 && day !== 6) count++
  }
  return d.toISOString().slice(0, 10)
}

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
  const [modalStep, setModalStep] = useState(0)  // 0=案件建立 1=案件資訊 2=報告成果 3=內部檢核
  // payment rows state per case
  const [payRows, setPayRows] = useState<any[]>([])
  const [savingPay, setSavingPay] = useState(false)

  const loadAll = async () => {
    setLoading(true)
    const [cr, clr, pr] = await Promise.all([
      fetch('/api/cases').then(r=>r.json()),
      fetch('/api/clients').then(r=>r.json()),
      fetch('/api/payments').then(r=>r.json()),
    ])
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
    setModalStep(0)
    setModalOpen(true)
  }

  const saveCase = async () => {
    if (!sel) return
    setSaving(true)
    try {
      await fetch('/api/cases', { method:'PATCH', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ id:sel.id, ...sel }) })
      await loadAll()
      setPanelOpen(false)
    } finally { setSaving(false) }
  }

  const createNewCase = async () => {
    setSaving(true)
    try {
      await fetch('/api/cases', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(editing) })
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

      {/* ── 新增案件 Modal（4步驟 Stepper）── */}
      <div className={`mo-overlay ${modalOpen?'open':''}`} onClick={e=>{if(e.target===e.currentTarget)setModalOpen(false)}}>
        <div className="mo" style={{maxWidth:640,width:'95vw'}}>
          <div className="mo-hd">
            <h2>新增案件</h2>
            <button className="dp-close" onClick={()=>setModalOpen(false)}>✕</button>
          </div>

          {/* 步驟指示器 */}
          <div style={{display:'flex',borderBottom:'1px solid var(--bd)',padding:'0 20px'}}>
            {['案件建立','案件資訊','報告成果','內部檢核'].map((label,i)=>(
              <button key={i} onClick={()=>setModalStep(i)} style={{
                flex:1, padding:'10px 4px', fontSize:12, fontWeight:modalStep===i?700:400,
                color:modalStep===i?'var(--blue)':modalStep>i?'var(--tx2)':'var(--tx3)',
                background:'none', border:'none', borderBottom:modalStep===i?'2px solid var(--blue)':'2px solid transparent',
                cursor:'pointer', transition:'all .15s', display:'flex', alignItems:'center', justifyContent:'center', gap:5,
              }}>
                <span style={{
                  width:18, height:18, borderRadius:'50%', fontSize:10, fontWeight:700,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background:modalStep>i?'var(--blue)':modalStep===i?'var(--blue)':'var(--bd)',
                  color:'#fff',
                }}>{modalStep>i?'✓':i+1}</span>
                {label}
              </button>
            ))}
          </div>

          <div className="mo-body" style={{maxHeight:'62vh',overflowY:'auto'}}>

            {/* ──── STEP 0：案件建立 ──── */}
            {modalStep===0&&(
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {/* 委託單位 */}
                <div className="fg">
                  <label>委託單位 *</label>
                  <div className="dd-wrap">
                    <input className="fi" value={newClientSearch}
                      onChange={e=>{setNewClientSearch(e.target.value);setNewClientDD(true);setEditing((p:any)=>({...p,clientId:'',clientName:'',contactIdx:0,contactPhone:'',contactMobile:''}))}}
                      onFocus={()=>setNewClientDD(true)} onBlur={()=>setTimeout(()=>setNewClientDD(false),200)}
                      placeholder="搜尋客戶名稱…" />
                    {newClientDD && newClientOpts.length>0 && (
                      <div className="dd">
                        {newClientOpts.slice(0,8).map((c:any)=>(
                          <div key={c.id} className="dd-opt" onClick={()=>{
                            setEditing((p:any)=>({...p,clientId:c.id,clientName:c.name,contactIdx:0,contactPhone:'',contactMobile:''}))
                            setNewClientSearch(c.name); setNewClientDD(false)
                          }}>{c.name} <span className="dd-sub">{c.clientType}</span></div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 選擇窗口（連動委託單位） */}
                {editing.clientId&&(()=>{
                  const client = clients.find((c:any)=>c.id===editing.clientId)
                  if(!client) return null
                  const ctList = [1,2,3,4].map(i=>({
                    idx:i-1,
                    name:(client as any)[`contact${i}Name`]||'',
                    title:(client as any)[`contact${i}Title`]||'',
                    phone:(client as any)[`contact${i}Phone`]||'',
                    mobile:(client as any)[`contact${i}Mobile`]||'',
                  })).filter(ct=>ct.name)
                  if(!ctList.length) return null
                  return (
                    <div className="fg">
                      <label>選擇承辦窗口</label>
                      <div style={{display:'flex',flexDirection:'column',gap:4}}>
                        {ctList.map((ct,i)=>(
                          <label key={i} style={{
                            display:'flex',alignItems:'center',gap:10,
                            padding:'8px 10px',borderRadius:6,cursor:'pointer',
                            border:`1px solid ${editing.contactIdx===ct.idx?'var(--blue)':'var(--bd)'}`,
                            background:editing.contactIdx===ct.idx?'color-mix(in srgb, var(--blue) 8%, transparent)':'var(--bgc)',
                          }}>
                            <input type="radio" style={{accentColor:'var(--blue)'}}
                              checked={editing.contactIdx===ct.idx}
                              onChange={()=>setEditing((p:any)=>({...p,contactIdx:ct.idx,contactPhone:ct.phone,contactMobile:ct.mobile}))}
                            />
                            <span style={{fontWeight:600,fontSize:13}}>{ct.name}</span>
                            {ct.title&&<span style={{fontSize:11,color:'var(--tx3)'}}>{ct.title}</span>}
                            {(ct.phone||ct.mobile)&&(
                              <span style={{fontSize:11,fontFamily:'var(--m)',color:'var(--tx2)',marginLeft:'auto'}}>
                                {ct.phone||ct.mobile}
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {/* 窗口電話/手機自動顯示 */}
                {(editing.contactPhone||editing.contactMobile)&&(
                  <div style={{display:'flex',gap:8}}>
                    {editing.contactPhone&&(
                      <div className="fg" style={{flex:1}}>
                        <label style={{color:'var(--tx3)'}}>電話（自動帶入）</label>
                        <div className="fi" style={{background:'var(--bgh)',color:'var(--tx2)',fontFamily:'var(--m)'}}>{editing.contactPhone}</div>
                      </div>
                    )}
                    {editing.contactMobile&&(
                      <div className="fg" style={{flex:1}}>
                        <label style={{color:'var(--tx3)'}}>手機（自動帶入）</label>
                        <div className="fi" style={{background:'var(--bgh)',color:'var(--tx2)',fontFamily:'var(--m)'}}>{editing.contactMobile}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* 組別 + 順位 */}
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
              </div>
            )}

            {/* ──── STEP 1：案件資訊 ──── */}
            {modalStep===1&&(
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <div className="row2">
                  <div className="fg"><label>案件名稱 *</label><input className="fi" value={editing.name||''} onChange={e=>setEditing((p:any)=>({...p,name:e.target.value}))} /></div>
                  <div className="fg"><label>案件類型</label>
                    <select className="fi" value={editing.caseType||''} onChange={e=>setEditing((p:any)=>({...p,caseType:e.target.value}))}>
                      <option value="">—</option>{TYPES.map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* 勘估資訊 */}
                <div style={{borderTop:'1px solid var(--bd)',paddingTop:10}}>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>勘估資訊</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                    <div className="fg"><label>縣市</label><input className="fi" value={editing.city||''} onChange={e=>setEditing((p:any)=>({...p,city:e.target.value}))} placeholder="例：台北市" /></div>
                    <div className="fg"><label>區域</label><input className="fi" value={editing.district||''} onChange={e=>setEditing((p:any)=>({...p,district:e.target.value}))} placeholder="例：信義區" /></div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                    <div className="fg"><label>地段</label><input className="fi" value={editing.landSection||''} onChange={e=>setEditing((p:any)=>({...p,landSection:e.target.value}))} placeholder="例：信義段" /></div>
                    <div className="fg"><label>地號</label><input className="fi" value={editing.landNo||''} onChange={e=>setEditing((p:any)=>({...p,landNo:e.target.value}))} placeholder="例：123-456" /></div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    <div className="fg"><label>建號</label><input className="fi" value={editing.buildingNo||''} onChange={e=>setEditing((p:any)=>({...p,buildingNo:e.target.value}))} /></div>
                    <div className="fg"><label>門牌</label><input className="fi" value={editing.doorPlate||''} onChange={e=>setEditing((p:any)=>({...p,doorPlate:e.target.value}))} placeholder="例：信義路5段7號" /></div>
                  </div>
                </div>
              </div>
            )}

            {/* ──── STEP 2：報告成果 ──── */}
            {modalStep===2&&(()=>{
              const SubRow = ({label,ck,setck,qty,setqty,cop,setcop}:any) => (
                <div style={{display:'grid',gridTemplateColumns:'24px 1fr 80px 80px',gap:8,alignItems:'center',marginBottom:6}}>
                  <input type="checkbox" checked={ck} onChange={e=>setck(e.target.checked)} style={{accentColor:'var(--blue)',width:14,height:14}} />
                  <span style={{fontSize:12,color:ck?'var(--tx)':'var(--tx3)'}}>{label}</span>
                  <input className="fi" type="number" min="1" placeholder="式" disabled={!ck}
                    value={qty} onChange={e=>setqty(e.target.value)}
                    style={{padding:'4px 6px',fontSize:12,opacity:ck?1:0.4}} />
                  <input className="fi" type="number" min="1" placeholder="份" disabled={!ck}
                    value={cop} onChange={e=>setcop(e.target.value)}
                    style={{padding:'4px 6px',fontSize:12,opacity:ck?1:0.4}} />
                </div>
              )
              const u = (field:string) => (v:any) => setEditing((p:any)=>({...p,[field]:v}))
              return (
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  {/* 繳交資訊 */}
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>繳交資訊</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                      {/* 中文 */}
                      <div>
                        <div style={{fontSize:12,fontWeight:600,marginBottom:6,color:'var(--tx2)'}}>中文</div>
                        <div style={{display:'grid',gridTemplateColumns:'24px 1fr 80px 80px',gap:8,marginBottom:4}}>
                          <span/><span style={{fontSize:10,color:'var(--tx3)',fontWeight:700}}>項目</span>
                          <span style={{fontSize:10,color:'var(--tx3)',fontWeight:700}}>式</span>
                          <span style={{fontSize:10,color:'var(--tx3)',fontWeight:700}}>份</span>
                        </div>
                        <SubRow label="數字" ck={editing.zhCount} setck={u('zhCount')} qty={editing.zhCountQty} setqty={u('zhCountQty')} cop={editing.zhCountCopies} setcop={u('zhCountCopies')} />
                        <SubRow label="摘要" ck={editing.zhAbstract} setck={u('zhAbstract')} qty={editing.zhAbstractQty} setqty={u('zhAbstractQty')} cop={editing.zhAbstractCopies} setcop={u('zhAbstractCopies')} />
                        <SubRow label="報告書" ck={editing.zhReport} setck={u('zhReport')} qty={editing.zhReportQty} setqty={u('zhReportQty')} cop={editing.zhReportCopies} setcop={u('zhReportCopies')} />
                        <SubRow label="電子檔" ck={editing.zhDigital} setck={u('zhDigital')} qty={editing.zhDigitalQty} setqty={u('zhDigitalQty')} cop={editing.zhDigitalCopies} setcop={u('zhDigitalCopies')} />
                        <SubRow label="光碟" ck={editing.zhCD} setck={u('zhCD')} qty={editing.zhCDQty} setqty={u('zhCDQty')} cop={editing.zhCDCopies} setcop={u('zhCDCopies')} />
                        <SubRow label="免簽證摘要" ck={editing.zhNoSealAbstract} setck={u('zhNoSealAbstract')} qty={editing.zhNoSealAbstractQty} setqty={u('zhNoSealAbstractQty')} cop={editing.zhNoSealAbstractCopies} setcop={u('zhNoSealAbstractCopies')} />
                      </div>
                      {/* 英文 */}
                      <div>
                        <div style={{fontSize:12,fontWeight:600,marginBottom:6,color:'var(--tx2)'}}>英文</div>
                        <div style={{display:'grid',gridTemplateColumns:'24px 1fr 80px 80px',gap:8,marginBottom:4}}>
                          <span/><span style={{fontSize:10,color:'var(--tx3)',fontWeight:700}}>項目</span>
                          <span style={{fontSize:10,color:'var(--tx3)',fontWeight:700}}>式</span>
                          <span style={{fontSize:10,color:'var(--tx3)',fontWeight:700}}>份</span>
                        </div>
                        <SubRow label="數字" ck={editing.enCount} setck={u('enCount')} qty={editing.enCountQty} setqty={u('enCountQty')} cop={editing.enCountCopies} setcop={u('enCountCopies')} />
                        <SubRow label="摘要" ck={editing.enAbstract} setck={u('enAbstract')} qty={editing.enAbstractQty} setqty={u('enAbstractQty')} cop={editing.enAbstractCopies} setcop={u('enAbstractCopies')} />
                        <SubRow label="報告書" ck={editing.enReport} setck={u('enReport')} qty={editing.enReportQty} setqty={u('enReportQty')} cop={editing.enReportCopies} setcop={u('enReportCopies')} />
                        <SubRow label="電子檔" ck={editing.enDigital} setck={u('enDigital')} qty={editing.enDigitalQty} setqty={u('enDigitalQty')} cop={editing.enDigitalCopies} setcop={u('enDigitalCopies')} />
                        <SubRow label="光碟" ck={editing.enCD} setck={u('enCD')} qty={editing.enCDQty} setqty={u('enCDQty')} cop={editing.enCDCopies} setcop={u('enCDCopies')} />
                      </div>
                    </div>
                  </div>

                  {/* 日期資訊 */}
                  <div style={{borderTop:'1px solid var(--bd)',paddingTop:10}}>
                    <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>日期資訊</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                      <div className="fg"><label>交辦日期</label><input type="date" className="fi" value={editing.assignDate||''} onChange={e=>setEditing((p:any)=>({...p,assignDate:e.target.value}))} /></div>
                      <div className="fg"><label>現勘日期</label><input type="date" className="fi" value={editing.siteVisitDate||''} onChange={e=>setEditing((p:any)=>({...p,siteVisitDate:e.target.value}))} /></div>
                      <div className="fg"><label>價格日期</label><input type="date" className="fi" value={editing.priceDate||''} onChange={e=>setEditing((p:any)=>({...p,priceDate:e.target.value}))} /></div>
                      <div className="fg">
                        <label>預計出件日期</label>
                        <input type="date" className="fi" value={editing.dueDate||''}
                          onChange={e=>{
                            const d = e.target.value
                            setEditing((p:any)=>({...p,dueDate:d,staffDoneDate:subtractWorkdays(d,3)}))
                          }} />
                      </div>
                      <div className="fg">
                        <label style={{display:'flex',alignItems:'center',gap:4}}>
                          承辦完成日期
                          <span style={{fontSize:10,color:'var(--tx3)',fontWeight:400}}>(預計出件前3個工作日)</span>
                        </label>
                        <input type="date" className="fi" value={editing.staffDoneDate||''}
                          onChange={e=>setEditing((p:any)=>({...p,staffDoneDate:e.target.value}))}
                          style={{background:editing.staffDoneDate&&editing.staffDoneDate===subtractWorkdays(editing.dueDate,3)?'color-mix(in srgb, var(--blue) 5%, var(--bgc))':undefined}} />
                      </div>
                      <div className="fg"><label>實際出件日期</label><input type="date" className="fi" value={editing.actualDueDate||''} onChange={e=>setEditing((p:any)=>({...p,actualDueDate:e.target.value}))} /></div>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* ──── STEP 3：內部檢核 ──── */}
            {modalStep===3&&(
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                {/* 簽證估價師 */}
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>簽證(負責)估價師</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                    {['胡毓忠','陳志豪','張博宇','黃慈妮'].map(a=>{
                      const active = editing.appraisers?.includes(a)
                      return (
                        <button key={a} onClick={()=>setEditing((p:any)=>({...p,appraisers:active?p.appraisers.filter((x:string)=>x!==a):[...p.appraisers,a]}))}
                          style={{padding:'5px 12px',borderRadius:5,border:`1px solid ${active?'var(--blue)':'var(--bd)'}`,background:active?'var(--blue)':'var(--bgc)',color:active?'#fff':'var(--tx)',fontSize:12,fontWeight:active?600:400,cursor:'pointer'}}>
                          {a}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 承辦窗口 */}
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>承辦窗口</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                    {['張博宇','徐文靜','黃湞儀','黃慈妮','吳韋萱','許紘齊','方謙','郭旭庭'].map(a=>{
                      const active = editing.assignees?.includes(a)
                      return (
                        <button key={a} onClick={()=>setEditing((p:any)=>({...p,assignees:active?p.assignees.filter((x:string)=>x!==a):[...p.assignees,a]}))}
                          style={{padding:'5px 12px',borderRadius:5,border:`1px solid ${active?'var(--blue)':'var(--bd)'}`,background:active?'var(--blue)':'var(--bgc)',color:active?'#fff':'var(--tx)',fontSize:12,fontWeight:active?600:400,cursor:'pointer'}}>
                          {displayName(a)}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 簽約金額 */}
                <div className="fg">
                  <label>簽約金額</label>
                  <input type="number" className="fi" value={editing.contractAmount||''} onChange={e=>setEditing((p:any)=>({...p,contractAmount:parseFloat(e.target.value)||null}))} />
                </div>

                {/* 備註 */}
                <div className="fg">
                  <label>備註</label>
                  <textarea className="dp-note" style={{minHeight:64}} value={editing.caseNotes||''} onChange={e=>setEditing((p:any)=>({...p,caseNotes:e.target.value}))} placeholder="其他注意事項…" />
                </div>
              </div>
            )}

          </div>

          {/* Footer：上一步 / 下一步 / 建立 */}
          <div className="mo-ft">
            <button className="btn btn-ghost" onClick={()=>{if(modalStep===0)setModalOpen(false);else setModalStep(s=>s-1)}}>
              {modalStep===0?'取消':'← 上一步'}
            </button>
            <div style={{display:'flex',gap:8}}>
              {modalStep<3
                ? <button className="btn btn-primary" onClick={()=>setModalStep(s=>s+1)}
                    disabled={modalStep===0&&!editing.clientId&&!editing.name}>
                    下一步 →
                  </button>
                : <button className="btn btn-primary" onClick={createNewCase} disabled={saving}>
                    {saving?'建立中…':'✓ 建立案件'}
                  </button>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CasesPage() {
  return <Suspense fallback={<div className="loading"><div className="spin"/></div>}><CasesInner /></Suspense>
}
