'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'

export default function StuckPage() {
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cases').then(r=>r.json()).then(d => {
      setCases(d.filter((c: any) => c.status === '擱淺'))
      setLoading(false)
    })
  }, [])

  return (
    <div className="app">
      <Sidebar />
      <div className="main-content">
        <div className="page-hd"><h1>擱淺追蹤</h1></div>
        <div className="stat-bar"><span>擱淺中 <b style={{color:'var(--warn)'}}>{cases.length}</b> 件</span></div>
        <div className="page-ct">
          {loading ? <div style={{padding:48,textAlign:'center',color:'var(--tx3)'}}>載入中…</div> : (
            <table>
              <thead><tr><th>案件</th><th>組別</th><th>承辦</th><th>擱淺原因</th></tr></thead>
              <tbody>
                {cases.length === 0 && <tr><td colSpan={4} style={{textAlign:'center',padding:40,color:'var(--tx3)'}}>目前無擱淺案件</td></tr>}
                {cases.map((c: any) => (
                  <tr key={c.id}>
                    <td style={{fontWeight:500}}>{c.name}</td>
                    <td><span className="tg tg-o">{c.team}</span></td>
                    <td style={{fontSize:12}}>{(c.assignees||[]).join(', ')||'—'}</td>
                    <td style={{color:'var(--tx2)',maxWidth:300}}>{c.stuckReason||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
