'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'

const COLS = ['未啟動','進行中','等待中','覆核中','已完成','擱淺']

export default function KanbanPage() {
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    (async()=>{
      setLoading(true)
      const r = await fetch('/api/cases')
      const d = await r.json()
      setCases(Array.isArray(d)?d:[])
      setLoading(false)
    })()
  },[])

  return (
    <div className="app">
      <Sidebar/>
      <div className="main">
        <div className="page-hd"><h1>看板</h1></div>
        {loading ? <div className="loading"><div className="spin"/></div>
        : (
          <div className="page-ct" style={{paddingBottom:0,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:`repeat(${COLS.length},1fr)`,gap:12,height:'calc(100vh - 110px)',overflow:'auto'}}>
              {COLS.map(col=>{
                const colCases = cases.filter(c=>c.status===col)
                return (
                  <div key={col} className="kanban-col" style={{height:'fit-content',minHeight:80}}>
                    <div className="kanban-lbl">{col} <span style={{fontSize:10,opacity:.6}}>({colCases.length})</span></div>
                    {colCases.map(c=>(
                      <a key={c.id} href={`/cases?highlight=${c.id}`} className={`kanban-card ${c.redFlag?'flag':''}`}>
                        <div style={{fontSize:12,fontWeight:600,marginBottom:4}}>
                          {c.redFlag && <span style={{color:'var(--rose)',fontSize:10,marginRight:4}}>●</span>}
                          {c.name}
                        </div>
                        <div style={{fontSize:11,color:'var(--tx3)',display:'flex',justifyContent:'space-between'}}>
                          <span>{c.team} · {(c.assignees||[]).join('、')}</span>
                          {c.priority && c.priority!=='普通' && <span className={`tg tg-${c.priority==='特急'?'rose':'amber'}`} style={{fontSize:9}}>{c.priority}</span>}
                        </div>
                      </a>
                    ))}
                    {colCases.length===0 && <div style={{fontSize:11,color:'var(--tx3)',textAlign:'center',padding:'16px 0'}}>無</div>}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
