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
  const [dismissed, setDismissed] = useState<Record<string,boolean>>({})
  const [resolving, setResolving] = useState<Record<string,boolean>>({})

  const loadData = async () => {
    const [cr,pr] = await Promise.all([
      fetch('/api/cases').then(r=>r.json()),
      fetch('/api/payments').then(r=>r.json()),
    ])
    setCases(Array.isArray(cr)?cr:[])
    setPayments(Array.isArray(pr)?pr:[])
  }

  useEffect(()=>{
    (async()=>{ setLoading(true); await loadData(); setLoading(false) })()
  },[])

  // 解決紅燈 → PATCH 案件 Notion (redFlag: false)
  const resolveRedFlag = async (caseId: string) => {
    setResolving(p=>({...p,[caseId]:true}))
    try {
      await fetch('/api/cases', {
        method:'PATCH',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ id:caseId, redFlag:false, redFlagNote:'' })
      })
      await loadData()
    } finally {
      setResolving(p=>({...p,[caseId]:false}))
    }
  }

  // 解決可請款 → 只在本地 dismiss (付款狀態由付款頁管理)
  const dismissPayment = (paymentId: string) => {
    setDismissed(p=>({...p,[paymentId]:true}))
  }

  const active = cases.filter(c=>c.status==='進行中')
  const redFlag = cases.filter(c=>c.redFlag)
  const received = payments.filter(p=>p.status==='已收款').reduce((s,p)=>s+(p.amount||0),0)
  const invoiceable = payments.filter(p=>p.status==='可請款' && !dismissed[p.id])

  if (loading) return <div className="app"><Sidebar/><div className="main"><div className="loading"><div className="spin"/></div></div></div>

  const todoCount = redFlag.length + invoiceable.length

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
            <div className="sc"><div className="sc-l">可請款金額</div><div className="sc-v" style={{fontSize:18,color:'var(--blue)'}}>{fmt(payments.filter(p=>p.status==='可請款').reduce((s,p)=>s+(p.amount||0),0))}</div><div className="sc-s">{payments.filter(p=>p.status==='可請款').length} 筆</div></div>
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
              <div className="card-hd">
                <h2>待處理事項</h2>
                {todoCount > 0 && (
                  <span style={{fontSize:11,color:'var(--tx3)'}}>{todoCount} 項</span>
                )}
              </div>
              <div style={{padding:'4px 0'}}>
                {redFlag.map(c=>(
                  <div key={c.id} style={{
                    padding:'10px 14px',borderBottom:'1px solid var(--bdl)',
                    display:'flex',gap:8,alignItems:'flex-start',
                    background: resolving[c.id] ? 'var(--bgh)' : undefined,
                    opacity: resolving[c.id] ? 0.6 : 1,
                    transition:'all .2s'
                  }}>
                    <input type="checkbox" checked={false} disabled={resolving[c.id]}
                      style={{marginTop:2,cursor:'pointer',accentColor:'var(--sage)',flexShrink:0}}
                      onChange={()=>resolveRedFlag(c.id)}
                      title="勾選表示已解決，會同步更新 Notion"
                    />
                    <div style={{flex:1,minWidth:0}}>
                      <span className="tg tg-rose" style={{fontSize:10,marginRight:6}}>紅燈</span>
                      <span style={{fontSize:13,fontWeight:600}}>{c.name}</span>
                      {c.redFlagNote && <div style={{fontSize:11,color:'var(--tx3)',marginTop:2}}>{c.redFlagNote}</div>}
                    </div>
                    {resolving[c.id] && <span style={{fontSize:10,color:'var(--tx3)'}}>同步中…</span>}
                  </div>
                ))}
                {invoiceable.map(p=>(
                  <div key={p.id} style={{
                    padding:'10px 14px',borderBottom:'1px solid var(--bdl)',
                    display:'flex',gap:8,alignItems:'flex-start',
                  }}>
                    <input type="checkbox" checked={false}
                      style={{marginTop:2,cursor:'pointer',accentColor:'var(--sage)',flexShrink:0}}
                      onChange={()=>dismissPayment(p.id)}
                      title="勾選表示已知悉，移出待處理清單（請至付款頁更新狀態）"
                    />
                    <div style={{flex:1,minWidth:0}}>
                      <span className="tg tg-blue" style={{fontSize:10,marginRight:6}}>可請款</span>
                      <span style={{fontSize:13,fontWeight:600}}>{p.caseName}</span>
                      <span style={{fontFamily:'var(--m)',fontSize:12,color:'var(--tx2)',marginLeft:6}}>{fmt(p.amount)}</span>
                    </div>
                  </div>
                ))}
                {redFlag.length===0 && invoiceable.length===0 && (
                  <div style={{padding:'20px 14px',fontSize:13,color:'var(--tx3)',textAlign:'center'}}>目前無待處理事項 ✓</div>
                )}
              </div>
              {todoCount > 0 && (
                <div style={{padding:'8px 14px',borderTop:'1px solid var(--bd)',fontSize:11,color:'var(--tx3)'}}>
                  紅燈勾選後同步 Notion；可請款請至<a href="/payments" style={{color:'var(--blue)'}}>付款頁</a>更新狀態
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
