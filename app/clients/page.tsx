'use client'
import { useEffect, useState, useRef } from 'react'
import Sidebar from '@/components/Sidebar'

const CLIENT_TYPES = ['政府機關','金融機構','建設公司','個人','其他']
const GIFTS = [
  { key:'giftDragonBoat', label:'端午' },
  { key:'giftMidAutumn',  label:'中秋' },
  { key:'giftNewYear',    label:'春節' },
  { key:'giftYearEnd',    label:'年節' },
]

interface Client {
  id:string; name:string; taxId:string; phone:string; fax:string; address:string
  contact1Name:string; contact1Phone:string; contact1Email:string
  contact2Name:string; contact2Phone:string; contact2Email:string
  giftDragonBoat:boolean; giftMidAutumn:boolean; giftNewYear:boolean; giftYearEnd:boolean
  clientType:string; notes:string; createdAt:string
}

const emptyClient = ():Partial<Client> => ({
  name:'', taxId:'', phone:'', fax:'', address:'',
  contact1Name:'', contact1Phone:'', contact1Email:'',
  contact2Name:'', contact2Phone:'', contact2Email:'',
  giftDragonBoat:false, giftMidAutumn:false, giftNewYear:false, giftYearEnd:false,
  clientType:'', notes:''
})

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [giftFilter, setGiftFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [expanded, setExpanded] = useState<Record<string,boolean>>({})
  const [casesMap, setCasesMap] = useState<Record<string,any[]>>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Client>>(emptyClient())
  const [saving, setSaving] = useState(false)
  const isNew = useRef(true)

  const load = async () => {
    setLoading(true)
    const r = await fetch('/api/clients')
    const d = await r.json()
    setClients(Array.isArray(d) ? d : [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const loadCases = async (clientId: string) => {
    if (casesMap[clientId]) return
    const r = await fetch(`/api/cases?clientId=${clientId}`)
    const d = await r.json()
    setCasesMap(prev => ({ ...prev, [clientId]: Array.isArray(d) ? d : [] }))
  }

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = { ...prev, [id]: !prev[id] }
      if (next[id]) loadCases(id)
      return next
    })
  }

  const openNew = () => {
    isNew.current = true
    setEditing(emptyClient())
    setModalOpen(true)
  }
  const openEdit = (c: Client) => {
    isNew.current = false
    setEditing({ ...c })
    setModalOpen(true)
  }
  const save = async () => {
    setSaving(true)
    try {
      if (isNew.current) {
        await fetch('/api/clients', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(editing) })
      } else {
        await fetch('/api/clients', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(editing) })
      }
      await load()
      setModalOpen(false)
    } finally { setSaving(false) }
  }

  const filtered = clients.filter(c => {
    if (search && !c.name.includes(search)) return false
    if (typeFilter && c.clientType !== typeFilter) return false
    if (giftFilter) {
      const k = giftFilter as keyof Client
      if (!c[k]) return false
    }
    return true
  })

  const redCount = clients.filter((c:any) => c.redFlag).length

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <div className="page-hd">
          <h1>客戶管理</h1>
          <div className="page-hd-r">
            <input className="search-input" placeholder="搜尋客戶…" value={search} onChange={e=>setSearch(e.target.value)} />
            <button className="btn btn-primary btn-sm" onClick={openNew}>＋ 新增客戶</button>
          </div>
        </div>

        <div className="filter-bar">
          <div className="filter-chip">
            類型
            <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
              <option value="">全部</option>
              {CLIENT_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="filter-chip">
            節日送禮
            <select value={giftFilter} onChange={e=>setGiftFilter(e.target.value)}>
              <option value="">全部</option>
              {GIFTS.map(g=><option key={g.key} value={g.key}>{g.label}</option>)}
            </select>
          </div>
        </div>

        <div className="stat-bar">
          <span>共 <b>{filtered.length}</b> 客戶</span>
          {redCount > 0 && <span style={{color:'var(--rose)'}}>業務紅燈 <b>{redCount}</b></span>}
        </div>

        <div className="scroll-area">
          {/* 表頭 */}
          <div style={{display:'grid',gridTemplateColumns:'30px 1fr 1fr 80px 150px 60px',alignItems:'center',padding:'7px 14px',borderBottom:'1px solid var(--bd)',background:'var(--bgh)'}}>
            {['','客戶名稱','聯絡人','案件數','節日送禮',''].map((h,i)=>(
              <span key={i} style={{fontSize:10,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.05em'}}>{h}</span>
            ))}
          </div>

          {loading ? (
            <div className="loading"><div className="spin"/><span>載入中…</span></div>
          ) : filtered.length === 0 ? (
            <div className="loading">無符合條件的客戶</div>
          ) : filtered.map(c => (
            <div key={c.id} className="client-row-wrap">
              <div className="client-hrow" style={{gridTemplateColumns:'30px 1fr 1fr 80px 150px 60px'}}
                onClick={()=>toggleExpand(c.id)}>
                <span style={{fontSize:11,color:'var(--tx3)',transition:'transform .15s',display:'inline-block',transform:expanded[c.id]?'rotate(90deg)':''}}>▶</span>
                <span style={{fontWeight:600}}>{c.name}</span>
                <span style={{fontSize:12,color:'var(--tx2)'}}>{c.contact1Name}{c.contact1Phone ? ` · ${c.contact1Phone}` : ''}</span>
                <span><span className="tg tg-blue" style={{fontSize:10}}>— 件</span></span>
                <div style={{display:'flex',gap:6}}>
                  {GIFTS.map(g=>(
                    <label key={g.key} style={{display:'flex',alignItems:'center',gap:3,fontSize:12,cursor:'pointer'}} onClick={e=>e.stopPropagation()}>
                      <input type="checkbox" checked={!!(c as any)[g.key]} readOnly />{g.label}
                    </label>
                  ))}
                </div>
                <button className="btn btn-sm" onClick={e=>{e.stopPropagation();openEdit(c)}}>編輯</button>
              </div>

              {expanded[c.id] && (
                <div className="client-expand open">
                  <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.04em'}}>旗下案件</div>
                  {!casesMap[c.id] ? (
                    <div style={{fontSize:12,color:'var(--tx3)'}}>載入中…</div>
                  ) : casesMap[c.id].length === 0 ? (
                    <div style={{fontSize:12,color:'var(--tx3)'}}>尚無案件</div>
                  ) : casesMap[c.id].map((cs:any) => (
                    <a key={cs.id} href={`/cases?highlight=${cs.id}`} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 10px',background:'var(--bgc)',border:'1px solid var(--bd)',borderRadius:5,marginBottom:5,fontSize:12,cursor:'pointer',textDecoration:'none'}}>
                      <span><b>{cs.name}</b> <span style={{color:'var(--tx3)',fontFamily:'var(--m)',fontSize:11}}>#{cs.caseNumber}</span></span>
                      <div style={{display:'flex',gap:8,alignItems:'center'}}>
                        <span className={`st ${cs.status==='進行中'?'st-a':cs.status==='已完成'?'st-d':cs.status==='擱淺'?'st-s':'st-r'}`}>{cs.status}</span>
                        <span style={{fontFamily:'var(--m)',fontSize:11,color:'var(--tx2)'}}>
                          {cs.contractAmount ? `$${cs.contractAmount.toLocaleString()}` : '—'}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MODAL */}
      <div className={`mo-overlay ${modalOpen?'open':''}`} onClick={e=>{if(e.target===e.currentTarget)setModalOpen(false)}}>
        <div className="mo">
          <div className="mo-hd">
            <h2>{isNew.current ? '新增客戶' : '編輯客戶'}</h2>
            <button className="dp-close" onClick={()=>setModalOpen(false)}>✕</button>
          </div>
          <div className="mo-body">
            <div className="row2">
              <div className="fg">
                <label>客戶名稱 *</label>
                <input className="fi" value={editing.name||''} onChange={e=>setEditing(p=>({...p,name:e.target.value}))} />
              </div>
              <div className="fg">
                <label>類型</label>
                <select className="fi" value={editing.clientType||''} onChange={e=>setEditing(p=>({...p,clientType:e.target.value}))}>
                  <option value="">— 選擇 —</option>
                  {CLIENT_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="row2">
              <div className="fg"><label>統一編號</label><input className="fi" value={editing.taxId||''} onChange={e=>setEditing(p=>({...p,taxId:e.target.value}))} /></div>
              <div className="fg"><label>公司電話</label><input className="fi" value={editing.phone||''} onChange={e=>setEditing(p=>({...p,phone:e.target.value}))} /></div>
            </div>
            <div className="fg"><label>公司地址</label><input className="fi" value={editing.address||''} onChange={e=>setEditing(p=>({...p,address:e.target.value}))} /></div>

            {/* 聯絡窗口 */}
            <div style={{border:'1px solid var(--bd)',borderRadius:6,padding:12}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:8}}>聯絡窗口 1</div>
              <div className="row2">
                <div className="fg"><label>姓名</label><input className="fi" value={editing.contact1Name||''} onChange={e=>setEditing(p=>({...p,contact1Name:e.target.value}))} /></div>
                <div className="fg"><label>電話</label><input className="fi" value={editing.contact1Phone||''} onChange={e=>setEditing(p=>({...p,contact1Phone:e.target.value}))} /></div>
              </div>
              <div className="fg" style={{marginTop:8}}><label>Email</label><input className="fi" type="email" value={editing.contact1Email||''} onChange={e=>setEditing(p=>({...p,contact1Email:e.target.value}))} /></div>
            </div>
            <div style={{border:'1px solid var(--bd)',borderRadius:6,padding:12}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:8}}>聯絡窗口 2</div>
              <div className="row2">
                <div className="fg"><label>姓名</label><input className="fi" value={editing.contact2Name||''} onChange={e=>setEditing(p=>({...p,contact2Name:e.target.value}))} /></div>
                <div className="fg"><label>電話</label><input className="fi" value={editing.contact2Phone||''} onChange={e=>setEditing(p=>({...p,contact2Phone:e.target.value}))} /></div>
              </div>
              <div className="fg" style={{marginTop:8}}><label>Email</label><input className="fi" type="email" value={editing.contact2Email||''} onChange={e=>setEditing(p=>({...p,contact2Email:e.target.value}))} /></div>
            </div>

            <div>
              <div style={{fontSize:10,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>節日送禮</div>
              <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
                {GIFTS.map(g=>(
                  <label key={g.key} style={{display:'flex',alignItems:'center',gap:5,fontSize:12,cursor:'pointer'}}>
                    <input type="checkbox" checked={!!(editing as any)[g.key]}
                      onChange={e=>setEditing(p=>({...p,[g.key]:e.target.checked}))} />
                    {g.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="fg"><label>備註</label><textarea className="dp-note" value={editing.notes||''} onChange={e=>setEditing(p=>({...p,notes:e.target.value}))} /></div>
          </div>
          <div className="mo-ft">
            <button className="btn btn-ghost" onClick={()=>setModalOpen(false)}>取消</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'儲存中…':'儲存'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
