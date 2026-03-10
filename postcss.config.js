'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'

const ALL_STAFF = [
  {name:'慈妮',team:'妮組',role:'leader'},
  {name:'紘齊',team:'妮組',role:'staff'},
  {name:'韋萱',team:'妮組',role:'staff'},
  {name:'文靜',team:'文組',role:'leader'},
  {name:'Jenny',team:'文組',role:'staff'},
  {name:'旭廷',team:'文組',role:'staff'},
  {name:'方謙',team:'文組',role:'staff'},
]
const PC: Record<string,string> = {
  慈妮:'#B45309',文靜:'#065F46',紘齊:'#9F1239',韋萱:'#4338CA',
  Jenny:'#BE185D',旭廷:'#92400E',方謙:'#1E40AF',
}
const uc = (n: string) => PC[n] || '#3F3F46'
const dfD = (n: number) => <span className="df"><span className="df-on">{'■'.repeat(n)}</span><span className="df-off">{'■'.repeat(5-n)}</span></span>

export default function WorkloadPage() {
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cases').then(r => r.json()).then(d => { setCases(d); setLoading(false) })
  }, [])

  const active = cases.filter(c => c.status === '進行中')

  return (
    <div className="app">
      <Sidebar />
      <div className="main-content">
        <div className="page-hd"><h1>負荷分析</h1></div>
        <div className="page-ct">
          {loading ? <div style={{padding:48,textAlign:'center',color:'var(--tx3)'}}>載入中…</div> : (
            <div style={{padding:'20px 24px'}}>
              <p style={{fontSize:11,color:'var(--tx3)',marginBottom:16}}>僅計入「進行中」案件的負荷</p>
              {['妮組','文組'].map(team => {
                const members = ALL_STAFF.filter(u => u.team === team)
                return (
                  <div key={team} style={{marginBottom:24}}>
                    <div style={{fontSize:11,fontWeight:600,color:'var(--tx2)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:10}}>{team}</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:12}}>
                      {members.map(usr => {
                        const mc = active.filter(c => (c.assignees||[]).includes(usr.name))
                        const load = mc.reduce((s: number, c: any) => s + (parseInt(c.difficulty)||0), 0)
                        const pct = Math.min(100, load / 20 * 100)
                        const lvl = pct > 80 ? '高負荷' : pct > 50 ? '中等' : '尚可'
                        const cls = pct > 80 ? 'tg-d' : pct > 50 ? 'tg-w' : 'tg-ok'
                        const pc = uc(usr.name)
                        return (
                          <div key={usr.name} className="wc">
                            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                              <span className="pn"><span className="pn-a" style={{background:pc}}>{usr.name[0]}</span>{usr.name}</span>
                              <span className={`tg ${cls}`}>{lvl}</span>
                            </div>
                            <div style={{display:'flex',gap:16,fontSize:12,color:'var(--tx2)',marginBottom:8}}>
                              <span>進行中 <b style={{color:'var(--tx)'}}>{mc.length}</b></span>
                              <span>難度加總 <b style={{color:'var(--tx)'}}>{load}</b></span>
                            </div>
                            <div className="dc-bar">
                              <div className="dc-fill" style={{width:`${pct}%`,background:pct>80?'var(--dng)':pct>50?'var(--warn)':pc}} />
                            </div>
                            <div className="wc-cases">
                              {mc.map((c: any) => (
                                <div key={c.id} className="wc-row">
                                  <span className="st st-a" />
                                  <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</span>
                                  {dfD(parseInt(c.difficulty)||0)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
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
