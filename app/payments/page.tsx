'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'

const STATUSES = ['未請款','可請款','已請款','已收款']
const PERIODS = ['第1期','第2期','第3期','第4期','第5期','尾款']
const TYPES = ['一般款項','領銜費']
const fmt = (n:number|null) => n==null?'—':'$'+n.toLocaleString()
const fd = (d:string) => { if(!d) return '—'; const t=new Date(d); return `${t.getFullYear()}/${t.getMonth()+1}/${t.getDate()}` }

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fStatus, setFStatus] = useState('')
  const [fType, setFType] = useState('')
  const [editing, setEditing] = useState<any|null>(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const r = await fetch('/api/payments')
    const d = await r.json()
    setPayments(Array.isArray(d)?d:[])
    setLoading(false)
  }
  useEffect(()=>{ load() },[])

  const save = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await fetch('/api/payments', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(editing) })
      await load()
      setEditing(null)
    } finally { setSaving(false) }
  }

  const filtered = payments.filter(p => {
    if (fStatus && p.status !== fStatus) return false
    if (fType && p.paymentType !== fType) return false
    return true
  })

  const totalReceivable = filtered.reduce((s,p)=>s+(p.amount||0),0)
  const totalReceived = filtered.filter(p=>p.status==='已收款').reduce((s,p)=>s+(p.amount||0),0)
  const invoiceable = filtered.filter(p=>p.status==='可請款').reduce((s,p)=>s+(p.amount||0),0)
  const pending = filtered.filter(p=>p.status==='未請款').reduce((s,p)=>s+(p.amount||0),0)

  return (
    <div className="app">
      <Sidebar/>
      <div className="main">
        <div className="page-hd">
          <h1>付款管理</h1>
        </div>
        <div className="filter-bar">
          <div className="filter-chip">狀態<select value={fStatus} onChange={e=>setFStatus(e.target.value)}><option value="">全部</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
          <div className="filter-chip">類型<select value={fType} onChange={e=>setFType(e.target.value)}><option value="">全部</option>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
        </div>
        <div className="stat-bar">
          <span>應收 <b style={{fontFamily:'var(--m)'}}>${totalReceivable.toLocaleString()}</b></span>
          <span>已收 <b style={{color:'var(--sage)',fontFamily:'var(--m)'}}>${totalReceived.toLocaleString()}</b></span>
          <span>可請款 <b style={{color:'var(--blue)',fontFamily:'var(--m)'}}>${invoiceable.toLocaleString()}</b></span>
          <span>未請款 <b style={{color:'var(--tx3)',fontFamily:'var(--m)'}}>${pending.toLocaleString()}</b></span>
        </div>
        <div className="scroll-area">
          {loading ? <div className="loading"><div className="spin"/><span>載入中…</span></div>
          : filtered.length===0 ? <div className="loading">無付款記錄</div>
          : (
            <table>
              <thead><tr><th>案件</th><th>期別</th><th>類型</th><th>應收金額</th><th>狀態</th><th>請款日</th><th>收據號</th><th/></tr></thead>
              <tbody>
                {filtered.map(p=>(
                  <tr key={p.id} style={{background:p.status==='可請款'?'var(--blue-l)':''}}>
                    <td style={{fontWeight:600}}>{p.caseName}<span className="muted" style={{marginLeft:5,fontSize:11}}>{p.caseTeam}</span></td>
                    <td className="muted">{p.period}</td>
                    <td><span className={`tg ${p.paymentType==='領銜費'?'tg-mauve':'tg-muted'}`}>{p.paymentType||'一般款項'}</span></td>
                    <td className="mono">{fmt(p.amount)}</td>
                    <td>
                      <span className={`tg ${p.status==='已收款'?'tg-sage':p.status==='可請款'?'tg-blue':p.status==='已請款'?'tg-amber':'tg-muted'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="muted">{fd(p.invoiceDate)}</td>
                    <td className="mono muted">{p.receiptNo||'—'}</td>
                    <td><button className="btn btn-sm" onClick={e=>{e.stopPropagation();setEditing({...p})}}>編輯</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* EDIT MODAL */}
      {editing && (
        <div className="mo-overlay open" onClick={e=>{if(e.target===e.currentTarget)setEditing(null)}}>
          <div className="mo">
            <div className="mo-hd"><h2>編輯付款</h2><button className="dp-close" onClick={()=>setEditing(null)}>✕</button></div>
            <div className="mo-body">
              <div style={{padding:'8px 12px',background:'var(--bgh)',borderRadius:6,marginBottom:4}}>
                <div style={{fontWeight:600}}>{editing.caseName}</div>
                <div style={{fontSize:11,color:'var(--tx3)'}}>{editing.period} · {editing.paymentType}</div>
              </div>
              <div className="row2">
                <div className="fg"><label>狀態</label>
                  <select className="fi" value={editing.status||''} onChange={e=>setEditing((p:any)=>({...p,status:e.target.value}))}>
                    {STATUSES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="fg"><label>應收金額</label>
                  <input type="number" className="fi" value={editing.amount||''} onChange={e=>setEditing((p:any)=>({...p,amount:parseFloat(e.target.value)||null}))} />
                </div>
              </div>
              <div className="row2">
                <div className="fg"><label>請款日期</label><input type="date" className="fi" value={editing.invoiceDate||''} onChange={e=>setEditing((p:any)=>({...p,invoiceDate:e.target.value}))} /></div>
                <div className="fg"><label>實收日期</label><input type="date" className="fi" value={editing.receivedDate||''} onChange={e=>setEditing((p:any)=>({...p,receivedDate:e.target.value}))} /></div>
              </div>
              <div className="fg"><label>收據編號</label><input className="fi" value={editing.receiptNo||''} onChange={e=>setEditing((p:any)=>({...p,receiptNo:e.target.value}))} /></div>
              <div className="fg"><label>備註</label><textarea className="dp-note" value={editing.notes||''} onChange={e=>setEditing((p:any)=>({...p,notes:e.target.value}))} /></div>
            </div>
            <div className="mo-ft">
              <button className="btn btn-ghost" onClick={()=>setEditing(null)}>取消</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'儲存中…':'儲存'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
