'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

const TYPES = ['都更前期','都更','法拍','一般件','權利變換','容積代金','危老','國產署','公允價值評估','捷運聯開','地上權','合理市場租金','瑕疵','其他']
const STATUSES = ['未啟動','進行中','擱淺','覆核中','已完成']
const PRIORITIES = ['特急','優先','普通','緩慢']
const TEAMS = ['妮組','文組','未派']
const ASSIGNEES: Record<string,string[]> = {
  妮組: ['慈妮','紘齊','韋萱'],
  文組: ['文靜','Jenny','旭廷','方謙'],
  未派: [],
}
const ALL_ASSIGNEES = [...ASSIGNEES['妮組'], ...ASSIGNEES['文組']]
const APPRAISERS = ['所長','副所','博宇','慈妮','文靜']

const SM: Record<string,string> = { 未啟動:'i', 進行中:'a', 覆核中:'r', 擱淺:'s', 已完成:'d' }
const TY_CLS: Record<string,string> = {
  都更前期:'tg-1',都更:'tg-2',法拍:'tg-3',國產署:'tg-4',
  權利變換:'tg-2',容積代金:'tg-3',危老:'tg-1',公允價值評估:'tg-4',
  捷運聯開:'tg-1',地上權:'tg-3',合理市場租金:'tg-4',瑕疵:'tg-3',一般件:'tg-o'
}
const PRI_CLS: Record<string,string> = { 特急:'tg-1',優先:'tg-2',普通:'tg-o',緩慢:'tg-4' }
const PC: Record<string,string> = {
  慈妮:'#B45309',文靜:'#065F46',紘齊:'#9F1239',韋萱:'#4338CA',
  Jenny:'#BE185D',旭廷:'#92400E',方謙:'#1E40AF',博宇:'#0369A1',
}
const uc = (n: string) => PC[n] || '#3F3F46'
const fmt = (n: number | null | undefined) => n == null ? '—' : n.toLocaleString()
const fd = (d: string) => { if(!d) return '—'; const t = new Date(d); return `${t.getMonth()+1}/${t.getDate()}` }
const dl = (d: string) => { if(!d) return null; return Math.ceil((new Date(d).getTime() - Date.now()) / 864e5) }

interface Case_ {
  id: string
  caseNumber?: string
  name: string
  clientName?: string
  clientId?: string
  caseType?: string
  address?: string
  team?: string
  assignees?: string[]
  appraisers?: string[]
  status?: string
  priority?: string
  difficulty?: string
  contractAmount?: number | null
  discountRate?: number
  contractDate?: string
  plannedDate?: string
  assignDate?: string
  dueDate?: string
  stuckReason?: string
  progressNote?: string
  documentNotes?: string
  qualityScore?: number | null
  bonusQuarter?: string
  isLeading?: boolean
  redFlag?: boolean
  redFlagNote?: string
}

export default function CasesPage() {
  return (
    <Suspense fallback={<div style={{display:'flex'}}><Sidebar /><main className="main-content" style={{padding:40,color:'#888'}}>載入中…</main></div>}>
      <CasesInner />
    </Suspense>
  )
}

function CasesInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const highlightId = searchParams.get('highlight')
  const [cases, setCases] = useState<Case_[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'table'|'twoweek'>('table')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterTeam, setFilterTeam] = useState('')
  const [filterPri, setFilterPri] = useState('')
  const [filterAssignee, setFilterAssignee] = useState('')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('dueDate')
  const [sortAsc, setSortAsc] = useState(true)
  const [det, setDet] = useState<Case_ | null>(null)
  const [detEdited, setDetEdited] = useState<Case_ | null>(null)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [newCase, setNewCase] = useState<Partial<Case_>>({})

  const load = () => {
    setLoading(true)
    fetch('/api/cases').then(r => r.json()).then(d => {
      setCases(d)
      setLoading(false)
      // 若有 highlight 參數，等資料載入後自動展開該案件
      if (highlightId) {
        const found = d.find((c: Case_) => c.id === highlightId)
        if (found) openDet(found)
      }
    }).catch(() => setLoading(false))
  }
  useEffect(load, [])

  const vis = () => {
    let l = [...cases]
    if (filterStatus) l = l.filter(c => c.status === filterStatus)
    if (filterTeam) l = l.filter(c => c.team === filterTeam)
    if (filterPri) l = l.filter(c => c.priority === filterPri)
    if (filterAssignee) l = l.filter(c => (c.assignees||[]).includes(filterAssignee))
    if (search) { const q = search.toLowerCase(); l = l.filter(c => c.name.toLowerCase().includes(q) || (c.clientName||'').toLowerCase().includes(q)) }
    l.sort((a, b) => {
      const va = (a as any)[sortKey] || '9999'
      const vb = (b as any)[sortKey] || '9999'
      if (sortKey === 'priority') { const o = PRIORITIES; return sortAsc ? o.indexOf(va)-o.indexOf(vb) : o.indexOf(vb)-o.indexOf(va) }
      if (sortKey === 'status') { const o = STATUSES; return sortAsc ? o.indexOf(va)-o.indexOf(vb) : o.indexOf(vb)-o.indexOf(va) }
      return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
    })
    return l
  }

  const tS = (k: string) => { if (sortKey===k) setSortAsc(!sortAsc); else { setSortKey(k); setSortAsc(true) } }
  const ar = (k: string) => sortKey===k ? (sortAsc?' ↑':' ↓') : ''

  const dueDisp = (d: string, status?: string) => {
    const x = dl(d)
    if (x === null) return <span style={{color:'var(--tx3)'}}>—</span>
    if (status === '已完成') return <span style={{color:'var(--tx3)'}}>{fd(d)}</span>
    if (x < 0) return <span className="tg tg-d">逾期 {Math.abs(x)}天</span>
    if (x <= 3) return <span className="tg tg-w">剩 {x}天</span>
    if (x <= 7) return <span style={{color:'var(--tx2)'}}>{fd(d)} · 剩{x}天</span>
    return <span style={{color:'var(--tx3)'}}>{fd(d)}</span>
  }
  const dfD = (n: string) => <span className="df"><span className="df-on">{'■'.repeat(Number(n)||0)}</span><span className="df-off">{'■'.repeat(5-(Number(n)||0))}</span></span>
  const pnB = (name: string) => <span className="pn"><span className="pn-a" style={{background:uc(name)}}>{name[0]}</span>{name}</span>

  const openDet = (c: Case_) => { setDet(c); setDetEdited({...c}) }
  const closeDet = () => { setDet(null); setDetEdited(null) }
  const setDE = (k: keyof Case_, v: any) => setDetEdited(e => e ? {...e, [k]: v} : e)

  const saveDet = async () => {
    if (!detEdited) return
    setSaving(true)
    await fetch(`/api/cases/${detEdited.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(detEdited) })
    setSaving(false)
    load()
    closeDet()
  }

  const delCase = async (id: string) => {
    if (!confirm('確定刪除？')) return
    await fetch(`/api/cases/${id}`, { method:'DELETE' })
    closeDet(); load()
  }

  const saveNew = async () => {
    if (!newCase.name) { alert('請填寫案件名稱'); return }
    setSaving(true)
    await fetch('/api/cases', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(newCase) })
    setSaving(false); setModalOpen(false); setNewCase({}); load()
  }
  const setNF = (k: keyof Case_, v: any) => setNewCase(e => ({...e, [k]: v}))

  const filtered = vis()
  const active = filtered.filter(c => c.status !== '已完成')

  // --- Two-week view ---
  const renderTwoWeek = () => {
    const now = new Date()
    const mon1 = new Date(now); mon1.setDate(now.getDate()-now.getDay()+1); mon1.setHours(0,0,0,0)
    const sun1 = new Date(mon1); sun1.setDate(mon1.getDate()+6); sun1.setHours(23,59,59,999)
    const mon2 = new Date(mon1); mon2.setDate(mon1.getDate()+7)
    const sun2 = new Date(mon1); sun2.setDate(mon1.getDate()+13); sun2.setHours(23,59,59,999)
    const fmtR = (a: Date, b: Date) => `${a.getMonth()+1}/${a.getDate()} — ${b.getMonth()+1}/${b.getDate()}`
    const all = filtered.filter(c => c.status !== '已完成' && c.dueDate)
    const w1 = all.filter(c => { const d=new Date(c.dueDate!); return d>=mon1&&d<=sun1 }).sort((a,b)=>(a.dueDate||'').localeCompare(b.dueDate||''))
    const w2 = all.filter(c => { const d=new Date(c.dueDate!); return d>=mon2&&d<=sun2 }).sort((a,b)=>(a.dueDate||'').localeCompare(b.dueDate||''))
    const tblRows = (list: Case_[]) => list.length ? list.map(c => (
      <tr key={c.id} onClick={()=>openDet(c)}>
        <td>{dueDisp(c.dueDate||'', c.status)}</td>
        <td style={{fontWeight:500}}>{c.name}</td>
        <td><span className={`tg ${TY_CLS[c.caseType||'']||'tg-o'}`}>{c.caseType}</span></td>
        <td>{(c.assignees||[]).map(a=><span key={a}>{pnB(a)}</span>)}</td>
        <td style={{color:'var(--tx2)'}}>{c.clientName||'—'}</td>
        <td style={{color:'var(--tx2)',fontSize:12,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis'}}>{c.progressNote||'—'}</td>
      </tr>
    )) : <tr><td colSpan={6} style={{textAlign:'center',padding:'20px',color:'var(--tx3)'}}>本週無待出件</td></tr>

    return <div style={{padding:'20px 24px'}}>
      <div className="tw-section">
        <div className="tw-week-hd">本週 <span style={{color:'var(--tx3)',fontWeight:400}}>{fmtR(mon1,sun1)}</span> · <b style={{color:w1.length?'var(--tx)':'var(--tx3)'}}>{w1.length}</b> 件待出</div>
        <table><thead><tr><th>交件日</th><th>案件</th><th>類型</th><th>承辦</th><th>委託單位</th><th>進度備註</th></tr></thead><tbody>{tblRows(w1)}</tbody></table>
      </div>
      <div className="tw-section" style={{marginTop:24}}>
        <div className="tw-week-hd">下週 <span style={{color:'var(--tx3)',fontWeight:400}}>{fmtR(mon2,sun2)}</span> · <b style={{color:w2.length?'var(--tx)':'var(--tx3)'}}>{w2.length}</b> 件待出</div>
        <table><thead><tr><th>交件日</th><th>案件</th><th>類型</th><th>承辦</th><th>委託單位</th><th>進度備註</th></tr></thead><tbody>{tblRows(w2)}</tbody></table>
      </div>
    </div>
  }

  // --- Detail panel field row ---
  const pr = (lbl: string, val: React.ReactNode) => (
    <><div className="dp-gl">{lbl}</div><div className="dp-gv">{val}</div></>
  )
  const IS = 'border:1px solid var(--bd);border-radius:var(--rs);padding:4px 8px;font-size:13px;width:100%;font-family:var(--f);outline:none;background:var(--bgc)'

  return (
    <div className="app">
      <Sidebar />
      <div className="main-content">
        {/* Header */}
        <div className="page-hd">
          <h1>案件管理</h1>
          <div className="page-hd-actions">
            <input className="search-input" placeholder="搜尋案件或委託..." value={search} onChange={e => setSearch(e.target.value)} />
            <button className="btn btn-primary" onClick={() => { setNewCase({team:'妮組',priority:'普通',status:'未啟動',assignees:[],appraisers:[]}); setModalOpen(true) }}>＋ 新增</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-bar">
          {[{id:'table',l:'案件總覽'},{id:'twoweek',l:'近兩週出件'}].map(t => (
            <div key={t.id} className={`tab-item ${view===t.id?'active':''}`} onClick={()=>setView(t.id as any)}>{t.l}</div>
          ))}
        </div>

        {/* Filters */}
        {view === 'table' && (
          <div className="filter-bar">
            <div className="filter-chip">狀態 <select onChange={e=>setFilterStatus(e.target.value)}><option value="">全部</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="filter-chip">組別 <select onChange={e=>setFilterTeam(e.target.value)}><option value="">全部</option>{TEAMS.map(t=><option key={t}>{t}</option>)}</select></div>
            <div className="filter-chip">順位 <select onChange={e=>setFilterPri(e.target.value)}><option value="">全部</option>{PRIORITIES.map(p=><option key={p}>{p}</option>)}</select></div>
            <div style={{display:'flex',alignItems:'center',gap:5,marginLeft:8,borderLeft:'1px solid var(--bdl)',paddingLeft:8}}>
              <span style={{fontSize:11,color:'var(--tx3)'}}>人員</span>
              {ALL_ASSIGNEES.map(a => {
                const active = !filterAssignee || filterAssignee === a
                return <span key={a} className={`pc-badge ${active?'badge-active':'badge-inactive'}`}
                  style={{color:uc(a),background:uc(a)+'18'}}
                  onClick={() => setFilterAssignee(filterAssignee===a?'':a)}>{a}</span>
              })}
              {filterAssignee && <button style={{fontSize:10,color:'var(--tx3)',cursor:'pointer',padding:'2px 5px',border:'1px solid var(--bdl)',borderRadius:3,background:'none'}} onClick={()=>setFilterAssignee('')}>清除</button>}
            </div>
          </div>
        )}

        {/* Stat bar */}
        {view === 'table' && (
          <div className="stat-bar">
            <span>共 <b>{filtered.length}</b> 案</span>
            <span>進行中 <b>{filtered.filter(c=>c.status==='進行中').length}</b></span>
            <span>擱淺 <b style={{color:'var(--warn)'}}>{filtered.filter(c=>c.status==='擱淺').length}</b></span>
            <span>覆核 <b>{filtered.filter(c=>c.status==='覆核中').length}</b></span>
            {filtered.filter(c=>c.redFlag).length > 0 && <span style={{color:'#dc2626'}}>🔴 紅燈 <b>{filtered.filter(c=>c.redFlag).length}</b></span>}
            {active.some(c=>c.contractAmount) && <span style={{marginLeft:'auto'}}>簽約總額 <b>${fmt(active.reduce((s,c)=>s+(c.contractAmount||0),0))}</b></span>}
          </div>
        )}

        {/* Content */}
        <div className="page-ct">
          {view === 'twoweek' ? renderTwoWeek() : loading ? (
            <div style={{padding:48,textAlign:'center',color:'var(--tx3)'}}>載入中…</div>
          ) : (
            <table>
              <thead><tr>
                <th onClick={()=>tS('caseNumber')}>編號{ar('caseNumber')}</th>
                <th onClick={()=>tS('caseType')}>類型{ar('caseType')}</th>
                <th onClick={()=>tS('name')}>案件{ar('name')}</th>
                <th onClick={()=>tS('team')}>組別{ar('team')}</th>
                <th onClick={()=>tS('assignees')}>承辦</th>
                <th>簽證</th>
                <th onClick={()=>tS('status')}>狀態{ar('status')}</th>
                <th onClick={()=>tS('priority')}>順位{ar('priority')}</th>
                <th onClick={()=>tS('dueDate')}>交件日{ar('dueDate')}</th>
                <th>難度</th>
                <th>簽約金額</th>
              </tr></thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} onClick={()=>openDet(c)} style={{ background: c.redFlag ? '#fff5f5' : undefined }}>
                    <td style={{color:'var(--tx3)',fontFamily:'var(--m)',fontSize:11}}>
                      {c.redFlag && <span style={{color:'#dc2626',marginRight:4}} title={c.redFlagNote||'業務紅燈'}>🔴</span>}
                      {c.caseNumber||'—'}
                    </td>
                    <td><span className={`tg ${TY_CLS[c.caseType||'']||'tg-o'}`}>{c.caseType||'—'}</span></td>
                    <td style={{fontWeight:500,maxWidth:180}}>{c.name}</td>
                    <td><span className="tg tg-o">{c.team}</span></td>
                    <td>{(c.assignees||[]).map(a => <span key={a} className="pn" style={{marginRight:4}}><span className="pn-a" style={{background:uc(a)}}>{a[0]}</span>{a}</span>)}</td>
                    <td style={{fontSize:11,color:'var(--tx3)'}}>{(c.appraisers||[]).join(', ')||'—'}</td>
                    <td><span className={`st st-${SM[c.status||'']||'i'}`}>{c.status}</span></td>
                    <td><span className={`tg ${PRI_CLS[c.priority||'']||'tg-o'}`}>{c.priority}</span></td>
                    <td>{dueDisp(c.dueDate||'', c.status)}</td>
                    <td>{dfD(c.difficulty||'0')}</td>
                    <td style={{fontFamily:'var(--m)',fontSize:12,color:'var(--tx2)'}}>{c.contractAmount ? '$'+fmt(c.contractAmount) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Detail overlay ── */}
      <div className={`dov ${det?'open':''}`} onClick={e => { if (e.target === e.currentTarget) closeDet() }}>
        {det && detEdited && (
          <div className="dp">
            <div className="dp-hd">
              <span style={{fontSize:12,color:'var(--tx3)',fontFamily:'var(--m)'}}>{det.caseNumber||'（新案）'}</span>
              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                {det.status==='已完成' && <span className="tg tg-ok">已完成</span>}
                <button className="btn btn-primary btn-sm" onClick={saveDet} disabled={saving}>{saving?'儲存中':'儲存'}</button>
                <div className="dp-close" onClick={closeDet}>✕</div>
              </div>
            </div>
            <div className="dp-body">
              <div className="dp-title">
                <input style={{fontSize:20,fontWeight:700,border:'none',background:'transparent',width:'100%',outline:'none',letterSpacing:'-.02em',color:'var(--tx)',fontFamily:'var(--f)'}}
                  value={detEdited.name||''} onChange={e=>setDE('name',e.target.value)} />
              </div>
              <div className="dp-grid">
                {pr('類型', <select style={{border:'1px solid var(--bd)',borderRadius:'var(--rs)',padding:'4px 8px',fontSize:13,outline:'none',fontFamily:'var(--f)',background:'var(--bgc)'}} value={detEdited.caseType||''} onChange={e=>setDE('caseType',e.target.value)}>{TYPES.map(t=><option key={t}>{t}</option>)}</select>)}
                {pr('組別', <select style={{border:'1px solid var(--bd)',borderRadius:'var(--rs)',padding:'4px 8px',fontSize:13,outline:'none',fontFamily:'var(--f)',background:'var(--bgc)'}} value={detEdited.team||''} onChange={e=>setDE('team',e.target.value)}>{TEAMS.map(t=><option key={t}>{t}</option>)}</select>)}
                {pr('承辦', <div style={{display:'flex',gap:4,flexWrap:'wrap',alignItems:'center'}}>
                  {(detEdited.assignees||[]).map(a=><span key={a} className="tg tg-o" style={{cursor:'pointer'}} onClick={()=>setDE('assignees',(detEdited.assignees||[]).filter(x=>x!==a))}>{a} ✕</span>)}
                  <select style={{border:'1px solid var(--bd)',borderRadius:'var(--rs)',padding:'2px 6px',fontSize:11,outline:'none',background:'var(--bgc)',fontFamily:'var(--f)'}} value="" onChange={e=>{const v=e.target.value;if(v)setDE('assignees',[...(detEdited.assignees||[]).filter(x=>x!==v),v])}}>
                    <option value="">+承辦</option>{ALL_ASSIGNEES.map(a=><option key={a}>{a}</option>)}
                  </select>
                </div>)}
                {pr('簽證', <div style={{display:'flex',gap:4,flexWrap:'wrap',alignItems:'center'}}>
                  {(detEdited.appraisers||[]).map(a=><span key={a} className="tg tg-o" style={{cursor:'pointer'}} onClick={()=>setDE('appraisers',(detEdited.appraisers||[]).filter(x=>x!==a))}>{a} ✕</span>)}
                  <select style={{border:'1px solid var(--bd)',borderRadius:'var(--rs)',padding:'2px 6px',fontSize:11,outline:'none',background:'var(--bgc)',fontFamily:'var(--f)'}} value="" onChange={e=>{const v=e.target.value;if(v)setDE('appraisers',[...(detEdited.appraisers||[]).filter(x=>x!==v),v])}}>
                    <option value="">+簽證</option>{APPRAISERS.map(a=><option key={a}>{a}</option>)}
                  </select>
                </div>)}
                {pr('狀態', <select style={{border:'1px solid var(--bd)',borderRadius:'var(--rs)',padding:'4px 8px',fontSize:13,outline:'none',fontFamily:'var(--f)',background:'var(--bgc)'}} value={detEdited.status||''} onChange={e=>setDE('status',e.target.value)}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select>)}
                {pr('順位', <select style={{border:'1px solid var(--bd)',borderRadius:'var(--rs)',padding:'4px 8px',fontSize:13,outline:'none',fontFamily:'var(--f)',background:'var(--bgc)'}} value={detEdited.priority||''} onChange={e=>setDE('priority',e.target.value)}>{PRIORITIES.map(p=><option key={p}>{p}</option>)}</select>)}
                {pr('委託', <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <input className="fi-inline" value={detEdited.clientName||''} onChange={e=>setDE('clientName',e.target.value)} />
                  {det.clientId && <button className="btn btn-ghost" style={{fontSize:11,padding:'2px 8px'}} onClick={()=>router.push(`/clients?highlight=${det.clientId}`)}>→ 客戶頁</button>}
                </div>)}
                {pr('派件日', <input type="date" className="fi-inline" value={detEdited.assignDate||''} onChange={e=>setDE('assignDate',e.target.value)} />)}
                {pr('交件日', <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <input type="date" style={{border:'1px solid var(--bd)',borderRadius:'var(--rs)',padding:'4px 8px',fontSize:13,fontFamily:'var(--f)',outline:'none'}} value={detEdited.dueDate||''} onChange={e=>setDE('dueDate',e.target.value)} />
                  {dueDisp(detEdited.dueDate||'', detEdited.status)}
                </div>)}
                {pr('難度', <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <input type="range" min="1" max="5" value={detEdited.difficulty||'3'} style={{width:80}} onChange={e=>setDE('difficulty',e.target.value)} />
                  <span style={{fontSize:11,color:'var(--tx2)'}}>{detEdited.difficulty||'3'}/5</span>
                </div>)}
                {pr('簽約金額', <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{color:'var(--tx2)'}}>$</span>
                  <input type="number" style={{border:'1px solid var(--bd)',borderRadius:'var(--rs)',padding:'3px 6px',fontSize:12,fontFamily:'var(--m)',textAlign:'right',width:120,outline:'none'}}
                    value={detEdited.contractAmount||''} placeholder="0" onChange={e=>setDE('contractAmount',parseInt(e.target.value)||0)} />
                  <span style={{fontSize:11,color:'var(--tx3)'}}>元</span>
                </div>)}
                {pr('獎金季度', <select style={{border:'1px solid var(--bd)',borderRadius:'var(--rs)',padding:'4px 8px',fontSize:13,outline:'none',fontFamily:'var(--f)',background:'var(--bgc)'}} value={detEdited.bonusQuarter||''} onChange={e=>setDE('bonusQuarter',e.target.value)}>
                  <option value="">— 未指定</option>
                  {['Q1','Q2','Q3','Q4'].map(q=><option key={q}>{q}</option>)}
                </select>)}
              </div>

              {/* 業務紅燈 */}
              <div className="dp-sec" style={{background: detEdited.redFlag ? '#fff5f5' : undefined, borderRadius: 8, padding: detEdited.redFlag ? '12px' : '0'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom: detEdited.redFlag ? 8 : 0}}>
                  <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontWeight:600,fontSize:13}}>
                    <input type="checkbox" checked={!!detEdited.redFlag} onChange={e=>setDE('redFlag',e.target.checked)} />
                    🔴 業務紅燈（提醒承辦）
                  </label>
                </div>
                {detEdited.redFlag && (
                  <input className="fi-inline" style={{width:'100%'}} placeholder="紅燈原因，例如：初建期限 3/15 前需送件" value={detEdited.redFlagNote||''} onChange={e=>setDE('redFlagNote',e.target.value)} />
                )}
              </div>

              {/* 獎金明細 */}
              {(detEdited.contractAmount||0) > 0 && (
                <div className="dp-sec">
                  <h3>獎金明細</h3>
                  <div className="bonus-box">
                    {[['承辦個人獎金 2.5%', Math.round((detEdited.contractAmount||0)*2.5/100)],
                      ['組長控案獎金 1.5%', Math.round((detEdited.contractAmount||0)*1.5/100)],
                      ['團體獎金池 3.0%（季末分配）', Math.round((detEdited.contractAmount||0)*3/100)]
                    ].map(([l,v],i)=><div key={i} className="bonus-row">
                      <span className="bl" style={i===2?{color:'var(--warn)'}:{}}>{l}</span>
                      <span className="bv" style={i===2?{color:'var(--warn)'}:{}}>${fmt(v as number)}</span>
                    </div>)}
                  </div>
                  <div style={{fontSize:11,color:'var(--tx3)',marginTop:6}}>💡 團體獎金池於季末由組長統一分配</div>
                </div>
              )}

              {detEdited.status === '擱淺' && (
                <div className="dp-sec"><h3>擱淺原因</h3>
                  <textarea className="dp-note" style={{width:'100%',resize:'vertical'}} value={detEdited.stuckReason||''} onChange={e=>setDE('stuckReason',e.target.value)} />
                </div>
              )}
              <div className="dp-sec"><h3>進度備註</h3>
                <textarea className="dp-note" style={{width:'100%',resize:'vertical'}} value={detEdited.progressNote||''} onChange={e=>setDE('progressNote',e.target.value)} />
              </div>
              <div className="dp-sec"><h3>文件備註</h3>
                <textarea className="dp-note" style={{width:'100%',resize:'vertical',minHeight:40}} value={detEdited.documentNotes||''} onChange={e=>setDE('documentNotes',e.target.value)} />
              </div>
              <div className="dp-sec" style={{marginTop:24,paddingTop:16,borderTop:'1px solid var(--bdl)',display:'flex',gap:8}}>
                <button className="btn btn-danger btn-sm" onClick={()=>delCase(det.id)}>刪除案件</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── New case modal ── */}
      <div className={`mov ${modalOpen?'open':''}`} onClick={e => { if(e.target===e.currentTarget){setModalOpen(false);setNewCase({})} }}>
        <div className="mo">
          <div className="mo-hd"><h2>新增案件</h2><button onClick={()=>setModalOpen(false)}>✕</button></div>
          <div className="mo-body">
            <div className="fr">
              <div className="fg"><label>案件名稱 *</label><input className="fi" value={newCase.name||''} onChange={e=>setNF('name',e.target.value)} placeholder="案件簡稱" /></div>
              <div className="fg"><label>類型</label><select className="fi" value={newCase.caseType||''} onChange={e=>setNF('caseType',e.target.value)}><option value="">—</option>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
            </div>
            <div className="fr">
              <div className="fg"><label>組別</label><select className="fi" value={newCase.team||'妮組'} onChange={e=>setNF('team',e.target.value)}>{TEAMS.map(t=><option key={t}>{t}</option>)}</select></div>
              <div className="fg"><label>順位</label><select className="fi" value={newCase.priority||'普通'} onChange={e=>setNF('priority',e.target.value)}>{PRIORITIES.map(p=><option key={p}>{p}</option>)}</select></div>
            </div>
            <div className="fr">
              <div className="fg"><label>派件日</label><input type="date" className="fi" value={newCase.assignDate||new Date().toISOString().slice(0,10)} onChange={e=>setNF('assignDate',e.target.value)} /></div>
              <div className="fg"><label>預計交件日</label><input type="date" className="fi" value={newCase.dueDate||''} onChange={e=>setNF('dueDate',e.target.value)} /></div>
            </div>
            <div className="fr">
              <div className="fg"><label>簽約金額</label><input type="number" className="fi" value={newCase.contractAmount||''} placeholder="0" onChange={e=>setNF('contractAmount',parseInt(e.target.value)||0)} /></div>
              <div className="fg"><label>委託單位</label><input className="fi" value={newCase.clientName||''} onChange={e=>setNF('clientName',e.target.value)} /></div>
            </div>
            <div className="fg"><label>承辦人</label>
              <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:6}}>
                {(newCase.assignees||[]).map(a=><span key={a} className="tg tg-o" style={{cursor:'pointer'}} onClick={()=>setNF('assignees',(newCase.assignees||[]).filter(x=>x!==a))}>{a} ✕</span>)}
              </div>
              <select className="fi" value="" onChange={e=>{const v=e.target.value;if(v)setNF('assignees',[...(newCase.assignees||[]).filter(x=>x!==v),v])}}>
                <option value="">— 點選新增 —</option>{ALL_ASSIGNEES.map(a=><option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="fg"><label>簽證估價師</label>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:4}}>
                {APPRAISERS.map(a=><label key={a} style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:12,fontWeight:400,textTransform:'none'}}>
                  <input type="checkbox" checked={(newCase.appraisers||[]).includes(a)} onChange={e=>{const curr=newCase.appraisers||[];setNF('appraisers',e.target.checked?[...curr,a]:curr.filter(x=>x!==a))}} /> {a}
                </label>)}
              </div>
            </div>
          </div>
          <div className="mo-ft">
            <button className="btn btn-ghost" onClick={()=>{setModalOpen(false);setNewCase({})}}>取消</button>
            <button className="btn btn-primary" onClick={saveNew} disabled={saving}>{saving?'建立中…':'建立'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
