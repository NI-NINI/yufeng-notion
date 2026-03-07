'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import type { Payment_, Case_ } from '@/lib/notion'

const PERIODS = ['第1期','第2期','第3期','第4期','第5期','尾款']
const PAY_STATUSES = ['未請款','可請款','已請款','已收款']
const QUARTERS = ['Q1','Q2','Q3','Q4']
const PAY_CLS: Record<string,string> = { 未請款:'tg-o', 可請款:'tg-2', 已請款:'tg-w', 已收款:'tg-ok' }
const empty: Partial<Payment_> = { title:'', period:'第1期', status:'未請款', receiptNo:'', notes:'' }
const fmt = (n: number) => n >= 10000 ? `$${(n/10000).toFixed(1)}萬` : `$${n.toLocaleString()}`

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment_[]>([])
  const [cases, setCases] = useState<Case_[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Partial<Payment_>|null>(null)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([fetch('/api/payments').then(r=>r.json()), fetch('/api/cases').then(r=>r.json())])
      .then(([p,c]) => { setPayments(p); setCases(c); setLoading(false) })
  }
  useEffect(load, [])

  const filtered = filterStatus ? payments.filter(p => p.status === filterStatus) : payments
  const totalRcv = payments.reduce((s,p) => s+(p.amount??0), 0)
  const totalDone = payments.filter(p=>p.status==='已收款').reduce((s,p) => s+(p.amount??0), 0)
  const totalPend = payments.filter(p=>['可請款','已請款'].includes(p.status)).reduce((s,p) => s+(p.amount??0), 0)

  const save = async () => {
    if (!modal) return
    setSaving(true)
    const selectedCase = cases.find(c => c.id === modal.caseId)
    const title = modal.title || `${selectedCase?.name??'未知案件'} ${modal.period}`
    const payload = {...modal, title}
    if (modal.id) await fetch(`/api/payments/${modal.id}`, {method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    else await fetch('/api/payments', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    setSaving(false); setModal(null); load()
  }
  const del = async (id: string) => { if(!confirm('確定刪除？'))return; await fetch(`/api/payments/${id}`,{method:'DELETE'}); load() }
  const setF = (k: keyof Payment_, v: any) => setModal(m => m ? {...m,[k]:v} : m)

  return (
    <div className="app">
      <Sidebar />
      <div className="main-content">
        <div className="page-hd">
          <h1>付款管理</h1>
          <div className="page-hd-actions">
            <button className="btn btn-primary" onClick={()=>setModal({...empty})}>＋ 新增</button>
          </div>
        </div>
        <div className="filter-bar">
          <div className="filter-chip">狀態 <select onChange={e=>setFilterStatus(e.target.value)}><option value="">全部</option>{PAY_STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
        </div>
        <div className="stat-bar">
          <span>應收 <b>{fmt(totalRcv)}</b></span>
          <span style={{color:'var(--ok)'}}>已收 <b>{fmt(totalDone)}</b></span>
          <span style={{color:'var(--warn)'}}>待請/請款中 <b>{fmt(totalPend)}</b></span>
        </div>
        <div className="page-ct">
          {loading ? <div style={{padding:48,textAlign:'center',color:'var(--tx3)'}}>載入中…</div> : (
            <table>
              <thead><tr>
                <th>案件</th><th>期別</th><th>應收金額</th><th>收款狀態</th>
                <th>收據編號</th><th>請款季別</th><th>請款日期</th><th>實收日期</th><th></th>
              </tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{fontWeight:500}}>{p.caseName||p.title}</td>
                    <td><span className="tg tg-o">{p.period}</span></td>
                    <td style={{fontFamily:'var(--m)',fontWeight:600}}>{p.amount?fmt(p.amount):'—'}</td>
                    <td><span className={`tg ${PAY_CLS[p.status]||'tg-o'}`}>{p.status}</span></td>
                    <td style={{color:'var(--tx3)',fontFamily:'var(--m)',fontSize:12}}>{p.receiptNo||'—'}</td>
                    <td style={{color:'var(--tx2)'}}>{p.year?`${p.year} ${p.quarter}`:'—'}</td>
                    <td style={{color:'var(--tx3)',fontSize:12}}>{p.invoiceDate||'—'}</td>
                    <td style={{color:'var(--tx3)',fontSize:12}}>{p.receivedDate||'—'}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={e=>{e.stopPropagation();setModal(p)}}>編輯</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {modal && (
        <div className="mov open" onClick={e=>{if(e.target===e.currentTarget){setModal(null)}}}>
          <div className="mo">
            <div className="mo-hd"><h2>{modal.id?'編輯付款記錄':'新增付款記錄'}</h2><button onClick={()=>setModal(null)}>✕</button></div>
            <div className="mo-body">
              <div className="fg"><label>所屬案件</label>
                <select className="fi" value={modal.caseId??''} onChange={e=>setF('caseId',e.target.value)}>
                  <option value="">— 選擇案件 —</option>{cases.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="fr">
                <div className="fg"><label>期別</label><select className="fi" value={modal.period??'第1期'} onChange={e=>setF('period',e.target.value)}>{PERIODS.map(p=><option key={p}>{p}</option>)}</select></div>
                <div className="fg"><label>應收金額（元）</label><input className="fi" type="number" value={modal.amount??''} onChange={e=>setF('amount',Number(e.target.value)||null)} /></div>
              </div>
              <div className="fr">
                <div className="fg"><label>收款狀態</label><select className="fi" value={modal.status??'未請款'} onChange={e=>setF('status',e.target.value)}>{PAY_STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
                <div className="fg"><label>收據編號</label><input className="fi" value={modal.receiptNo??''} onChange={e=>setF('receiptNo',e.target.value)} /></div>
              </div>
              <div className="fr">
                <div className="fg"><label>請款年度</label><input className="fi" type="number" value={modal.year??new Date().getFullYear()} onChange={e=>setF('year',Number(e.target.value))} /></div>
                <div className="fg"><label>請款季別</label><select className="fi" value={modal.quarter??''} onChange={e=>setF('quarter',e.target.value)}><option value="">—</option>{QUARTERS.map(q=><option key={q}>{q}</option>)}</select></div>
              </div>
              <div className="fr">
                <div className="fg"><label>請款日期</label><input className="fi" type="date" value={modal.invoiceDate??''} onChange={e=>setF('invoiceDate',e.target.value)} /></div>
                <div className="fg"><label>實收日期</label><input className="fi" type="date" value={modal.receivedDate??''} onChange={e=>setF('receivedDate',e.target.value)} /></div>
              </div>
              <div className="fg"><label>備註</label><textarea className="fi" rows={2} style={{resize:'vertical'}} value={modal.notes??''} onChange={e=>setF('notes',e.target.value)} /></div>
            </div>
            <div className="mo-ft">
              {modal.id && <button className="btn btn-danger btn-sm" style={{marginRight:'auto'}} onClick={()=>del(modal.id!)}>刪除</button>}
              <button className="btn btn-ghost" onClick={()=>setModal(null)}>取消</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'儲存中…':'儲存'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
