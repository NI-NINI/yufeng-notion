'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'

const fd = (d:string) => { if(!d) return '—'; const t=new Date(d); return `${t.getMonth()+1}/${t.getDate()}` }
const dl = (d:string) => { if(!d) return null; return Math.ceil((new Date(d).getTime()-Date.now())/864e5) }
const fmt = (n:number) => '$'+n.toLocaleString()

export default function DashboardPage() {
  const [cases, setCases] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    (async()=>{
      setLoading(true)
      const [cr,pr] = await Promise.all([
        fetch('/api/cases').then(r=>r.json()),
        fetch('/api/payments').then(r=>r.json()),
      ])
      setCases(Array.isArray(cr)?cr:[])
      setPayments(Array.isArray(pr)?pr:[])
      setLoading(false)
    })()
  },[])

  const active = cases.filter(c=>c.status==='進行中')
  const redFlag = cases.filter(c=>c.redFlag)
  const received = payments.filter(p=>p.status==='已收款').reduce((s,p)=>s+(p.amount||0),0)
  const invoiceable = payments.filter(p=>p.status==='可請款')

  // 文件到期
  const docWarnings = cases.filter(c=>{
    if (!c.documentNotes) return false
    const days = dl(c.dueDate)
    return days !== null && days <= 3
  })

  if (loading) return <div className="app"><Sidebar/><div className="main"><div className="loading"><div className="spin"/></div></div></div>

  return (
    <div className="app">
      <Sidebar/>
      <div className="main">
        <div className="page-hd">
          <h1>總覽</h1>
        </div>
        <div className="page-ct">
          <div className="stat-grid">
            <div className="sc"><div className="sc-l">進行中案件</div><div className="sc-v">{active.length}</div><div className="sc-s">共 {cases.length} 件</div></div>
            <div className="sc"><div className="sc-l">本季實收</div><div className="sc-v" style={{fontSize:18}}>{fmt(received)}</div><div className="sc-s">{payments.filter(p=>p.status==='已收款').length} 筆已收款</div></div>
            <div className="sc"><div className="sc-l">可請款金額</div><div className="sc-v" style={{fontSize:18,color:'var(--blue)'}}>{fmt(invoiceable.reduce((s,p)=>s+(p.amount||0),0))}</div><div className="sc-s">{invoiceable.length} 筆</div></div>
            <div className="sc"><div className="sc-l">業務紅燈</div><div className="sc-v" style={{color:'var(--rose)'}}>{redFlag.length}</div><div className="sc-s">{redFlag.map(c=>c.name).join('、')||'無'}</div></div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16}}>
            <div className="card">
              <div className="card-hd">
                <h2>近期案件</h2>
                <a href="/cases" className="btn btn-sm">查看全部 →</a>
              </div>
              <table>
                <thead><tr><th>案件</th><th>組別</th><th>狀態</th><th>交件日</th></tr></thead>
                <tbody>
                  {cases.slice(0,6).map(c=>{
                    const days = dl(c.dueDate)
                    return (
                      <tr key={c.id} className={c.redFlag?'red-row':''}>
                        <td>
                          {c.redFlag && <span style={{color:'var(--rose)',fontSize:10,marginRight:4}}>●</span>}
                          <a href="/cases" style={{fontWeight:600}}>{c.name}</a>
                        </td>
                        <td className="muted">{c.team}</td>
                        <td><span className={`st ${c.status==='進行中'?'st-a':c.status==='已完成'?'st-d':c.status==='擱淺'?'st-s':'st-r'}`}>{c.status}</span></td>
                        <td>
                          {days !== null && days <= 3
                            ? <span style={{color:'var(--rose)',fontSize:11,fontWeight:days<0?600:400}}>{days<0?`逾期${Math.abs(days)}天`:`${days}天後`}</span>
                            : <span className="muted">{fd(c.dueDate)}</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="card">
              <div className="card-hd"><h2>待處理事項</h2></div>
              <div style={{padding:'4px 0'}}>
                {redFlag.map(c=>(
                  <div key={c.id} style={{padding:'8px 14px',borderBottom:'1px solid var(--bdl)',display:'flex',gap:8,alignItems:'flex-start'}}>
                    <span className="tg tg-rose" style={{fontSize:10,whiteSpace:'nowrap',marginTop:1}}>紅燈</span>
                    <span style={{fontSize:12}}>{c.name}{c.redFlagNote?` — ${c.redFlagNote}`:''}</span>
                  </div>
                ))}
                {invoiceable.map(p=>(
                  <div key={p.id} style={{padding:'8px 14px',borderBottom:'1px solid var(--bdl)',display:'flex',gap:8,alignItems:'flex-start'}}>
                    <span className="tg tg-blue" style={{fontSize:10,whiteSpace:'nowrap',marginTop:1}}>可請款</span>
                    <span style={{fontSize:12}}>{p.caseName} <span style={{fontFamily:'var(--m)'}}>{fmt(p.amount)}</span></span>
                  </div>
                ))}
                {redFlag.length===0 && invoiceable.length===0 && (
                  <div style={{padding:'16px 14px',fontSize:12,color:'var(--tx3)'}}>目前無待處理事項 ✓</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
