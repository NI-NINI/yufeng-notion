'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'

const COLS = ['未啟動','進行中','擱淺','覆核中']
const SM: Record<string,string> = { 未啟動:'i', 進行中:'a', 覆核中:'r', 擱淺:'s' }
const PRI_CLS: Record<string,string> = { 特急:'tg-1',優先:'tg-2',普通:'tg-o',緩慢:'tg-4' }
const PC: Record<string,string> = {
  慈妮:'#B45309',文靜:'#065F46',紘齊:'#9F1239',韋萱:'#4338CA',
  Jenny:'#BE185D',旭廷:'#92400E',方謙:'#1E40AF',
}
const uc = (n: string) => PC[n] || '#3F3F46'
const fd = (d: string) => { if(!d) return '—'; const t=new Date(d); return `${t.getMonth()+1}/${t.getDate()}` }
const dl = (d: string) => { if(!d) return null; return Math.ceil((new Date(d).getTime()-Date.now())/864e5) }

export default function KanbanPage() {
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cases').then(r=>r.json()).then(d=>{setCases(d);setLoading(false)})
  }, [])

  const dueD = (d: string) => {
    const x = dl(d)
    if (x === null) return null
    if (x < 0) return <span className="tg tg-d" style={{fontSize:10}}>逾{Math.abs(x)}天</span>
    if (x <= 3) return <span className="tg tg-w" style={{fontSize:10}}>剩{x}天</span>
    return <span style={{color:'var(--tx3)',fontSize:10}}>{fd(d)}</span>
  }

  const active = cases.filter(c => c.status !== '已完成')

  return (
    <div className="app">
      <Sidebar />
      <div className="main-content">
        <div className="page-hd"><h1>看板</h1></div>
        <div className="page-ct">
          {loading ? <div style={{padding:48,textAlign:'center',color:'var(--tx3)'}}>載入中…</div> : (
            <div className="kb">
              {COLS.map(col => {
                const items = active.filter(c => c.status === col)
                return (
                  <div key={col} className="kb-col">
                    <div className="kb-col-hd">
                      <span className={`st st-${SM[col]}`} />
                      {col} <span className="cnt">{items.length}</span>
                    </div>
                    <div className="kb-col-body">
                      {items.map(c => (
                        <div key={c.id} className="kb-card">
                          <div className="kb-card-title">{c.name}</div>
                          <div className="kb-card-meta">
                            <span className={`tg ${PRI_CLS[c.priority]||'tg-o'}`}>{c.priority}</span>
                            {(c.assignees||[]).slice(0,2).map((a: string) => (
                              <span key={a} className="pn"><span className="pn-a" style={{background:uc(a)}}>{a[0]}</span>{a}</span>
                            ))}
                            {dueD(c.dueDate||'')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
