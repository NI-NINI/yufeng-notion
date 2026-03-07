'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'

const dl = (d: string) => { if(!d) return null; return Math.ceil((new Date(d).getTime()-Date.now())/864e5) }
const fmt = (n: number) => n.toLocaleString()

export default function DashPage() {
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cases').then(r => r.json()).then(d => { setCases(d); setLoading(false) })
  }, [])

  const active = cases.filter(c => c.status !== '已完成')
  const ip = cases.filter(c => c.status === '進行中').length
  const st = cases.filter(c => c.status === '擱淺').length
  const od = active.filter(c => { const x = dl(c.dueDate); return x !== null && x < 0 }).length
  const ta = active.reduce((s,c) => s + (c.contractAmount||0), 0)
  const ni = active.filter(c => c.team === '妮組')
  const wen = active.filter(c => c.team === '文組')

  return (
    <div className="app">
      <Sidebar />
      <div className="main-content">
        <div className="page-hd"><h1>總覽</h1></div>
        <div className="page-ct">
          {loading ? <div style={{padding:48,textAlign:'center',color:'var(--tx3)'}}>載入中…</div> : (
            <>
              <div className="dash-grid">
                <div className="dc"><div className="dc-label">進行中</div><div className="dc-value">{ip}<small> 件</small></div></div>
                <div className="dc"><div className="dc-label">擱淺中</div><div className="dc-value" style={{color:'var(--warn)'}}>{st}<small> 件</small></div></div>
                <div className="dc"><div className="dc-label">已逾期</div><div className="dc-value" style={{color:'var(--dng)'}}>{od}<small> 件</small></div></div>
                {ta > 0 && <div className="dc"><div className="dc-label">簽約總額</div><div className="dc-value" style={{fontSize:20}}>${fmt(ta)}</div></div>}
                <div className="dc" style={{gridColumn:'1/-1'}}>
                  <div className="dc-label">雙組比較</div>
                  <div style={{display:'flex',gap:32,marginTop:10}}>
                    {[{label:'妮組',l:ni},{label:'文組',l:wen}].map(({label,l})=>(
                      <div key={label} style={{flex:1}}>
                        <div style={{fontWeight:600,fontSize:13,marginBottom:6}}>{label}</div>
                        <div style={{fontSize:12,color:'var(--tx2)'}}>
                          案件 <b style={{color:'var(--tx)'}}>{l.length}</b> ·
                          進行中 <b style={{color:'var(--tx)'}}>{l.filter(c=>c.status==='進行中').length}</b> ·
                          總額 <b style={{color:'var(--tx)'}}>${fmt(l.reduce((s,c)=>s+(c.contractAmount||0),0))}</b>
                        </div>
                        <div className="dc-bar" style={{marginTop:8}}>
                          <div className="dc-fill" style={{width:`${cases.length?l.length/cases.length*100:0}%`}} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick links */}
              <div style={{padding:'0 24px 24px',display:'flex',gap:10,flexWrap:'wrap'}}>
                {[
                  {href:'/cases',l:'案件管理','icon':'≡'},
                  {href:'/workload',l:'負荷分析','icon':'◎'},
                  {href:'/bonus',l:'獎金試算','icon':'◈'},
                  {href:'/gifts',l:'節日送禮','icon':'◇'},
                ].map(({href,l,icon})=>(
                  <Link key={href} href={href}>
                    <div className="dc" style={{cursor:'pointer',padding:'12px 16px',display:'flex',alignItems:'center',gap:8,minWidth:140}}>
                      <span style={{fontSize:16,opacity:.5}}>{icon}</span>
                      <span style={{fontWeight:500}}>{l}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
