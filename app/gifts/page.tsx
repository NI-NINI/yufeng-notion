'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'

const HOLIDAYS = [
  { key: 'spring', label: '春節', icon: '🧧', month: 1 },
  { key: 'dragon', label: '端午', icon: '🎋', month: 5 },
  { key: 'mid',    label: '中秋', icon: '🥮', month: 9 },
  { key: 'year',   label: '年節', icon: '🎁', month: 12 },
]

export default function GiftsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [giftState, setGiftState] = useState<Record<string, Record<string, {sent:boolean,item:string}>>>({})
  const [editItem, setEditItem] = useState<{cid:string,hk:string}|null>(null)
  const [itemText, setItemText] = useState('')

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(d => {
      const giftClients = d.filter((c: any) => c.isGiftTarget || c.gifts?.includes('送禮'))
      setClients(giftClients)
      setLoading(false)
    }).catch(() => { setClients([]); setLoading(false) })
  }, [])

  const getState = (cid: string, hk: string) => giftState[hk]?.[cid] || { sent: false, item: '' }
  const toggleSent = (cid: string, hk: string) => setGiftState(prev => ({
    ...prev, [hk]: { ...(prev[hk]||{}), [cid]: { ...getState(cid,hk), sent: !getState(cid,hk).sent } }
  }))
  const setItem = (cid: string, hk: string, val: string) => setGiftState(prev => ({
    ...prev, [hk]: { ...(prev[hk]||{}), [cid]: { ...getState(cid,hk), item: val } }
  }))

  return (
    <div className="app">
      <Sidebar />
      <div className="main-content">
        <div className="page-hd">
          <h1>節日送禮</h1>
          <span style={{fontSize:12,color:'var(--tx3)'}}>送禮記錄僅存在本機，不同瀏覽器不共享</span>
        </div>
        <div className="page-ct">
          {loading ? <div style={{padding:48,textAlign:'center',color:'var(--tx3)'}}>載入中…</div> : (
            <div style={{padding:'20px 24px'}}>
              {clients.length === 0 && (
                <div style={{padding:48,textAlign:'center',color:'var(--tx3)'}}>
                  尚無送禮對象<br/><span style={{fontSize:11}}>請在客戶管理中標記「送禮對象」</span>
                </div>
              )}
              {HOLIDAYS.map(h => {
                const states = clients.map(c => getState(c.id, h.key))
                const sent = states.filter(s => s.sent).length
                const pct = clients.length ? Math.round(sent/clients.length*100) : 0
                return (
                  <div key={h.key} className="gift-section">
                    <div className="gift-section-hd" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <span>{h.icon} {h.label}</span>
                      <span style={{fontWeight:400,color:'var(--tx3)'}}>{sent} / {clients.length} 已送出 · {pct}%</span>
                    </div>
                    <div className="gift-prog"><div className="gift-prog-fill" style={{width:`${pct}%`}} /></div>
                    <table style={{marginTop:12}}>
                      <thead><tr>
                        <th style={{width:36}}>送出</th>
                        <th>客戶名稱</th>
                        <th>禮品內容</th>
                      </tr></thead>
                      <tbody>
                        {clients.map(c => {
                          const st = getState(c.id, h.key)
                          return <tr key={c.id}>
                            <td>
                              <input type="checkbox" checked={st.sent} onChange={()=>toggleSent(c.id,h.key)}
                                style={{width:14,height:14,cursor:'pointer',accentColor:'var(--acc)'}} />
                            </td>
                            <td style={{fontWeight:500,color:st.sent?'var(--tx3)':'var(--tx)',textDecoration:st.sent?'line-through':''}}>{c.name}</td>
                            <td>
                              {editItem?.cid===c.id&&editItem?.hk===h.key ? (
                                <div style={{display:'flex',gap:6}}>
                                  <input className="fi-inline" style={{flex:1}} value={itemText} onChange={e=>setItemText(e.target.value)}
                                    onBlur={()=>{setItem(c.id,h.key,itemText);setEditItem(null)}}
                                    onKeyDown={e=>{if(e.key==='Enter'){setItem(c.id,h.key,itemText);setEditItem(null)}}}
                                    autoFocus />
                                </div>
                              ) : (
                                <span style={{fontSize:12,color:st.item?'var(--tx)':'var(--tx3)',cursor:'pointer'}}
                                  onClick={()=>{setEditItem({cid:c.id,hk:h.key});setItemText(st.item)}}>
                                  {st.item || '點擊填寫禮品…'}
                                </span>
                              )}
                            </td>
                          </tr>
                        })}
                      </tbody>
                    </table>
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
