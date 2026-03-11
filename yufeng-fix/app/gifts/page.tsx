'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'

const GIFTS = [
  { key:'giftDragonBoat', label:'端午節', emoji:'🐉' },
  { key:'giftMidAutumn',  label:'中秋節', emoji:'🥮' },
  { key:'giftNewYear',    label:'春節',   emoji:'🧧' },
  { key:'giftYearEnd',    label:'年節',   emoji:'🎊' },
]

export default function GiftsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Record<string,boolean>>({})

  useEffect(()=>{
    (async()=>{
      setLoading(true)
      const r = await fetch('/api/clients')
      const d = await r.json()
      setClients(Array.isArray(d)?d:[])
      setLoading(false)
    })()
  },[])

  const toggle = async (clientId:string, field:string, val:boolean) => {
    setSaving(p=>({...p,[clientId+field]:true}))
    try {
      await fetch('/api/clients', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:clientId,[field]:val}) })
      setClients(prev=>prev.map(c=>c.id===clientId?{...c,[field]:val}:c))
    } finally { setSaving(p=>({...p,[clientId+field]:false})) }
  }

  return (
    <div className="app">
      <Sidebar/>
      <div className="main">
        <div className="page-hd"><h1>節日送禮</h1></div>
        {loading ? <div className="loading"><div className="spin"/><span>載入中…</span></div>
        : (
          <div className="page-ct">
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
              {GIFTS.map(g=>(
                <div key={g.key} className="h-card">
                  <div className="h-card-hd">{g.emoji} {g.label}</div>
                  {clients.map(c=>(
                    <div key={c.id} className="h-row">
                      <span style={{fontSize:12}}>{c.name}</span>
                      <input type="checkbox"
                        checked={!!c[g.key]}
                        disabled={!!saving[c.id+g.key]}
                        onChange={e=>toggle(c.id,g.key,e.target.checked)} />
                    </div>
                  ))}
                  {clients.length===0 && <div style={{padding:'12px 14px',fontSize:12,color:'var(--tx3)'}}>無客戶</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
