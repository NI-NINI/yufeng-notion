'use client'
import { useEffect, useState, useRef } from 'react'
import Sidebar from '@/components/Sidebar'

const CLIENT_TYPES = ['政府機關','金融機構','建設公司','個人','其他']
const GIFT_TYPES = [
  { key: 'GiftMidAutumn', label: '中秋節' },
  { key: 'GiftYearEnd',   label: '年節禮' },
  { key: 'GiftCalendar',  label: '桌曆、年曆' },
] as const
type GiftKey = typeof GIFT_TYPES[number]['key']

interface Contact {
  name: string; dept: string; title: string
  phone: string; ext: string; mobile: string
  email: string; birthday: string; notes: string
  giftMidAutumn: boolean; giftYearEnd: boolean; giftCalendar: boolean
}
interface Client {
  id: string; clientNo: number | null; name: string; taxId: string
  phone: string; fax: string; address: string; clientType: string; notes: string; createdAt: string
  contact1Name: string; contact1Dept: string; contact1Title: string
  contact1Phone: string; contact1Ext: string; contact1Mobile: string
  contact1Email: string; contact1Birthday: string; contact1Notes: string
  contact1GiftMidAutumn: boolean; contact1GiftYearEnd: boolean; contact1GiftCalendar: boolean
  contact2Name: string; contact2Dept: string; contact2Title: string
  contact2Phone: string; contact2Ext: string; contact2Mobile: string
  contact2Email: string; contact2Birthday: string; contact2Notes: string
  contact2GiftMidAutumn: boolean; contact2GiftYearEnd: boolean; contact2GiftCalendar: boolean
  contact3Name: string; contact3Dept: string; contact3Title: string
  contact3Phone: string; contact3Ext: string; contact3Mobile: string
  contact3Email: string; contact3Birthday: string; contact3Notes: string
  contact3GiftMidAutumn: boolean; contact3GiftYearEnd: boolean; contact3GiftCalendar: boolean
  contact4Name: string; contact4Dept: string; contact4Title: string
  contact4Phone: string; contact4Ext: string; contact4Mobile: string
  contact4Email: string; contact4Birthday: string; contact4Notes: string
  contact4GiftMidAutumn: boolean; contact4GiftYearEnd: boolean; contact4GiftCalendar: boolean
  giftMidAutumn: boolean; giftYearEnd: boolean; giftCalendar: boolean
}

const emptyContact = (): Contact => ({
  name:'', dept:'', title:'', phone:'', ext:'', mobile:'',
  email:'', birthday:'', notes:'',
  giftMidAutumn: false, giftYearEnd: false, giftCalendar: false,
})

const getContacts = (c: Partial<Client>): Contact[] => {
  const cs: Contact[] = []
  for (let i = 1; i <= 4; i++) {
    const g = (f: string) => (c as any)[`contact${i}${f}`]
    const ct: Contact = {
      name: g('Name') || '', dept: g('Dept') || '', title: g('Title') || '',
      phone: g('Phone') || '', ext: g('Ext') || '', mobile: g('Mobile') || '',
      email: g('Email') || '', birthday: g('Birthday') || '', notes: g('Notes') || '',
      giftMidAutumn: g('GiftMidAutumn') || false,
      giftYearEnd: g('GiftYearEnd') || false,
      giftCalendar: g('GiftCalendar') || false,
    }
    if (ct.name || ct.phone || ct.email || i === 1) cs.push(ct)
  }
  return cs
}

const contactsToPayload = (contacts: Contact[]): Record<string, any> => {
  const out: Record<string, any> = {}
  for (let i = 1; i <= 4; i++) {
    const ct = contacts[i-1] || emptyContact()
    out[`contact${i}Name`] = ct.name; out[`contact${i}Dept`] = ct.dept
    out[`contact${i}Title`] = ct.title; out[`contact${i}Phone`] = ct.phone
    out[`contact${i}Ext`] = ct.ext; out[`contact${i}Mobile`] = ct.mobile
    out[`contact${i}Email`] = ct.email; out[`contact${i}Birthday`] = ct.birthday
    out[`contact${i}Notes`] = ct.notes
    out[`contact${i}GiftMidAutumn`] = ct.giftMidAutumn
    out[`contact${i}GiftYearEnd`] = ct.giftYearEnd
    out[`contact${i}GiftCalendar`] = ct.giftCalendar
  }
  return out
}

const emptyClient = (): Partial<Client> => ({
  name:'', taxId:'', phone:'', fax:'', address:'', clientType:'', notes:'',
  giftMidAutumn: false, giftYearEnd: false, giftCalendar: false,
})

interface GiftContact {
  clientName: string; clientNo: number|null; contactIdx: number
  name: string; dept: string; title: string
  phone: string; mobile: string; email: string
}

function buildGiftList(clients: Client[], giftKey: GiftKey): GiftContact[] {
  const list: GiftContact[] = []
  for (const c of clients) {
    for (let i = 1; i <= 4; i++) {
      const fullKey = `contact${i}${giftKey}` as keyof Client
      if ((c as any)[fullKey]) {
        list.push({
          clientName: c.name, clientNo: c.clientNo, contactIdx: i,
          name: (c as any)[`contact${i}Name`] || '',
          dept: (c as any)[`contact${i}Dept`] || '',
          title: (c as any)[`contact${i}Title`] || '',
          phone: (c as any)[`contact${i}Phone`] || '',
          mobile: (c as any)[`contact${i}Mobile`] || '',
          email: (c as any)[`contact${i}Email`] || '',
        })
      }
    }
  }
  return list
}

export default function ClientsPage() {
  const [tab, setTab] = useState<'list'|'gift'>('list')
  const [giftTab, setGiftTab] = useState<GiftKey>('GiftMidAutumn')
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [expanded, setExpanded] = useState<Record<string,boolean>>({})
  const [casesMap, setCasesMap] = useState<Record<string,any[]>>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Client>>(emptyClient())
  const [contacts, setContacts] = useState<Contact[]>([emptyContact()])
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string|null>(null)
  const [deleting, setDeleting] = useState(false)
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
    setContacts([emptyContact()])
    setModalOpen(true)
  }
  const openEdit = (c: Client) => {
    isNew.current = false
    setEditing({ ...c })
    const cs = getContacts(c)
    setContacts(cs.length > 0 ? cs : [emptyContact()])
    setModalOpen(true)
  }

  const updateContact = (i: number, field: keyof Contact, val: any) => {
    setContacts(prev => prev.map((c, idx) => idx === i ? {...c, [field]: val} : c))
  }
  const addContact = () => {
    if (contacts.length < 4) setContacts(prev => [...prev, emptyContact()])
  }
  const removeContact = (i: number) => {
    setContacts(prev => prev.filter((_,idx) => idx !== i))
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload = { ...editing, ...contactsToPayload(contacts) }
      if (isNew.current) {
        await fetch('/api/clients', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) })
      } else {
        await fetch('/api/clients', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) })
      }
      await load()
      setModalOpen(false)
    } finally { setSaving(false) }
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      await fetch('/api/clients', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id: deleteConfirm }) })
      await load()
      setDeleteConfirm(null)
    } finally { setDeleting(false) }
  }

  const filtered = clients.filter(c => {
    if (search && !c.name.includes(search) && !(c.clientNo?.toString().includes(search))) return false
    if (typeFilter && c.clientType !== typeFilter) return false
    return true
  })

  const giftList = buildGiftList(clients, giftTab)
  const fmtNo = (n: number|null) => n != null ? `CL-${String(n).padStart(4,'0')}` : '—'

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <div className="page-hd">
          <h1>客戶管理</h1>
          <div className="page-hd-r" style={{gap:8}}>
            <div style={{display:'flex',border:'1px solid var(--bd)',borderRadius:6,overflow:'hidden'}}>
              {(['list','gift'] as const).map(t=>(
                <button key={t} onClick={()=>setTab(t)}
                  style={{padding:'5px 14px',fontSize:13,border:'none',cursor:'pointer',
                    background: tab===t ? 'var(--blue)' : 'var(--bgc)',
                    color: tab===t ? '#fff' : 'var(--tx2)'}}>
                  {t==='list' ? '客戶列表' : '送禮篩選'}
                </button>
              ))}
            </div>
            {tab==='list' && (
              <>
                <input className="search-input" placeholder="搜尋委託單位…" value={search} onChange={e=>setSearch(e.target.value)} />
                <button className="btn btn-primary btn-sm" onClick={openNew}>＋ 新增客戶</button>
              </>
            )}
          </div>
        </div>

        {/* ── 客戶列表 ── */}
        {tab === 'list' && (
          <>
            <div className="filter-bar">
              <div className="filter-chip">
                類型
                <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
                  <option value="">全部</option>
                  {CLIENT_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="stat-bar"><span>共 <b>{filtered.length}</b> 筆</span></div>

            <div className="scroll-area">
              <div style={{display:'grid',gridTemplateColumns:'90px 1fr 110px 130px 80px',alignItems:'center',padding:'8px 16px',borderBottom:'1px solid var(--bd)',background:'var(--bgh)'}}>
                {['客戶編號','委託單位','統編','公司電話',''].map((h,i)=>(
                  <span key={i} style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.05em'}}>{h}</span>
                ))}
              </div>

              {loading ? (
                <div className="loading"><div className="spin"/><span>載入中…</span></div>
              ) : filtered.length === 0 ? (
                <div className="loading">無符合條件的客戶</div>
              ) : filtered.map(c => (
                <div key={c.id} className="client-row-wrap">
                  <div className="client-hrow" style={{gridTemplateColumns:'90px 1fr 110px 130px 80px'}} onClick={()=>toggleExpand(c.id)}>
                    <span style={{fontSize:12,fontFamily:'var(--m)',color:'var(--tx3)'}}>{fmtNo(c.clientNo)}</span>
                    <span style={{fontWeight:700,fontSize:14,display:'flex',alignItems:'center',gap:6}}>
                      <span style={{fontSize:12,color:'var(--tx3)',transition:'transform .15s',display:'inline-block',transform:expanded[c.id]?'rotate(90deg)':''}}>▶</span>
                      {c.name}
                      {c.clientType && <span style={{fontSize:11,padding:'1px 6px',borderRadius:4,background:'var(--bgh)',border:'1px solid var(--bd)',color:'var(--tx3)'}}>{c.clientType}</span>}
                    </span>
                    <span style={{fontSize:13,color:'var(--tx2)',fontFamily:'var(--m)'}}>{c.taxId||'—'}</span>
                    <span style={{fontSize:13,color:'var(--tx2)'}}>{c.phone||'—'}</span>
                    <div style={{display:'flex',gap:4}}>
                      <button className="btn btn-sm" onClick={e=>{e.stopPropagation();openEdit(c)}}>編輯</button>
                      <button className="btn btn-sm" style={{color:'var(--rose)'}} onClick={e=>{e.stopPropagation();setDeleteConfirm(c.id)}}>刪除</button>
                    </div>
                  </div>

                  {expanded[c.id] && (
                    <div className="client-expand open">
                      {getContacts(c).filter(ct=>ct.name||ct.phone||ct.mobile||ct.email).length > 0 && (
                        <div style={{display:'flex',gap:10,marginBottom:12,flexWrap:'wrap'}}>
                          {getContacts(c).filter(ct=>ct.name||ct.phone||ct.mobile||ct.email).map((ct,i)=>(
                            <div key={i} style={{background:'var(--bgc)',border:'1px solid var(--bd)',borderRadius:6,padding:'10px 14px',fontSize:12,minWidth:200,maxWidth:280}}>
                              <div style={{fontWeight:700,marginBottom:4,fontSize:13}}>{ct.name || `窗口 ${i+1}`}</div>
                              {(ct.dept||ct.title) && <div style={{color:'var(--tx3)',marginBottom:4}}>{[ct.dept,ct.title].filter(Boolean).join(' · ')}</div>}
                              {ct.phone && <div>📞 {ct.phone}{ct.ext ? ` 分機 ${ct.ext}` : ''}</div>}
                              {ct.mobile && <div>📱 {ct.mobile}</div>}
                              {ct.email && <div style={{color:'var(--blue)',fontSize:11}}>✉ {ct.email}</div>}
                              {ct.birthday && <div style={{color:'var(--tx3)'}}>🎂 {ct.birthday}</div>}
                              <div style={{display:'flex',gap:4,marginTop:5,flexWrap:'wrap'}}>
                                {ct.giftMidAutumn && <span style={{fontSize:10,padding:'1px 5px',borderRadius:3,background:'#fff4e5',border:'1px solid #fcd470',color:'#856030'}}>中秋</span>}
                                {ct.giftYearEnd   && <span style={{fontSize:10,padding:'1px 5px',borderRadius:3,background:'#fef0f0',border:'1px solid #f9a0a0',color:'#a33'}}>年節</span>}
                                {ct.giftCalendar  && <span style={{fontSize:10,padding:'1px 5px',borderRadius:3,background:'#f0f7ff',border:'1px solid #90bfef',color:'#2566a8'}}>桌曆</span>}
                              </div>
                              {ct.notes && <div style={{color:'var(--tx3)',marginTop:4,borderTop:'1px solid var(--bd)',paddingTop:4,fontSize:11}}>{ct.notes}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.04em'}}>案件</div>
                      {!casesMap[c.id] ? (
                        <div style={{fontSize:13,color:'var(--tx3)'}}>載入中…</div>
                      ) : casesMap[c.id].length === 0 ? (
                        <div style={{fontSize:13,color:'var(--tx3)'}}>尚無案件</div>
                      ) : casesMap[c.id].map((cs:any) => (
                        <a key={cs.id} href={`/cases?highlight=${cs.id}`}
                          style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',background:'var(--bgc)',border:'1px solid var(--bd)',borderRadius:6,marginBottom:5,fontSize:13,cursor:'pointer',textDecoration:'none'}}>
                          <span><b>{cs.name}</b> <span style={{color:'var(--tx3)',fontFamily:'var(--m)',fontSize:12}}>#{cs.caseNumber}</span></span>
                          <span className={`st ${cs.status==='進行中'?'st-a':cs.status==='已完成'?'st-d':'st-r'}`}>{cs.status}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── 送禮篩選 ── */}
        {tab === 'gift' && (
          <div>
            <div style={{display:'flex',gap:8,padding:'12px 16px',borderBottom:'1px solid var(--bd)',background:'var(--bgc)',alignItems:'center'}}>
              {GIFT_TYPES.map(g=>(
                <button key={g.key} onClick={()=>setGiftTab(g.key)}
                  style={{padding:'6px 16px',borderRadius:6,border:'1px solid var(--bd)',cursor:'pointer',fontSize:13,
                    fontWeight: giftTab===g.key ? 700 : 400,
                    background: giftTab===g.key ? 'var(--blue)' : 'var(--bgc)',
                    color: giftTab===g.key ? '#fff' : 'var(--tx)'}}>
                  {g.label}
                </button>
              ))}
              <span style={{marginLeft:'auto',fontSize:13,color:'var(--tx3)'}}>共 <b>{giftList.length}</b> 位</span>
            </div>
            <div style={{padding:'12px 16px'}}>
              {loading ? (
                <div className="loading"><div className="spin"/><span>載入中…</span></div>
              ) : giftList.length === 0 ? (
                <div className="loading" style={{padding:'40px 0'}}>此節日無送禮名單</div>
              ) : (
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                  <thead>
                    <tr style={{background:'var(--bgh)'}}>
                      {['委託單位','客戶編號','姓名','部門','職稱','電話','手機','Email'].map(h=>(
                        <th key={h} style={{padding:'8px 12px',textAlign:'left',fontWeight:700,fontSize:11,color:'var(--tx3)',borderBottom:'2px solid var(--bd)',letterSpacing:'.04em',textTransform:'uppercase'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {giftList.map((g,i)=>(
                      <tr key={i} style={{borderBottom:'1px solid var(--bd)'}}>
                        <td style={{padding:'8px 12px',fontWeight:600}}>{g.clientName}</td>
                        <td style={{padding:'8px 12px',fontFamily:'var(--m)',color:'var(--tx3)',fontSize:12}}>{fmtNo(g.clientNo)}</td>
                        <td style={{padding:'8px 12px'}}>{g.name||'—'}</td>
                        <td style={{padding:'8px 12px',color:'var(--tx2)'}}>{g.dept||'—'}</td>
                        <td style={{padding:'8px 12px',color:'var(--tx2)'}}>{g.title||'—'}</td>
                        <td style={{padding:'8px 12px',fontFamily:'var(--m)'}}>{g.phone||'—'}</td>
                        <td style={{padding:'8px 12px',fontFamily:'var(--m)'}}>{g.mobile||'—'}</td>
                        <td style={{padding:'8px 12px',color:'var(--blue)',fontSize:12}}>{g.email||'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── 新增/編輯 Modal ── */}
      <div className={`mo-overlay ${modalOpen?'open':''}`} onClick={e=>{if(e.target===e.currentTarget)setModalOpen(false)}}>
        <div className="mo" style={{maxWidth:680}}>
          <div className="mo-hd">
            <h2>{isNew.current ? '新增客戶' : '編輯客戶'}</h2>
            <button className="dp-close" onClick={()=>setModalOpen(false)}>✕</button>
          </div>
          <div className="mo-body">
            <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>基本資料</div>
            <div className="row2">
              <div className="fg"><label>委託單位 *</label><input className="fi" value={editing.name||''} onChange={e=>setEditing(p=>({...p,name:e.target.value}))} /></div>
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
            <div className="row2">
              <div className="fg"><label>傳真</label><input className="fi" value={editing.fax||''} onChange={e=>setEditing(p=>({...p,fax:e.target.value}))} /></div>
              <div className="fg"><label>公司地址</label><input className="fi" value={editing.address||''} onChange={e=>setEditing(p=>({...p,address:e.target.value}))} /></div>
            </div>

            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',margin:'16px 0 8px'}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.05em'}}>聯絡窗口</div>
              {contacts.length < 4 && <button className="btn btn-sm" onClick={addContact}>＋ 新增窗口</button>}
            </div>

            {contacts.map((ct, i) => (
              <div key={i} style={{border:'1px solid var(--bd)',borderRadius:8,padding:14,marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <span style={{fontSize:12,fontWeight:700,color:'var(--tx2)'}}>窗口 {i+1}</span>
                  {i >= 1 && <button style={{fontSize:11,color:'var(--rose)',cursor:'pointer',background:'none',border:'none'}} onClick={()=>removeContact(i)}>✕ 移除</button>}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:8}}>
                  <div className="fg"><label>姓名</label><input className="fi" value={ct.name} onChange={e=>updateContact(i,'name',e.target.value)} /></div>
                  <div className="fg"><label>部門</label><input className="fi" value={ct.dept} onChange={e=>updateContact(i,'dept',e.target.value)} /></div>
                  <div className="fg"><label>職稱</label><input className="fi" value={ct.title} onChange={e=>updateContact(i,'title',e.target.value)} /></div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:8}}>
                  <div className="fg"><label>電話</label><input className="fi" value={ct.phone} onChange={e=>updateContact(i,'phone',e.target.value)} /></div>
                  <div className="fg"><label>分機</label><input className="fi" value={ct.ext} onChange={e=>updateContact(i,'ext',e.target.value)} /></div>
                  <div className="fg"><label>手機</label><input className="fi" value={ct.mobile} onChange={e=>updateContact(i,'mobile',e.target.value)} /></div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:8}}>
                  <div className="fg"><label>Email</label><input className="fi" type="email" value={ct.email} onChange={e=>updateContact(i,'email',e.target.value)} /></div>
                  <div className="fg"><label>生日（月/日）</label><input className="fi" placeholder="MM/DD" value={ct.birthday} onChange={e=>updateContact(i,'birthday',e.target.value)} /></div>
                  <div className="fg"><label>窗口備註</label><input className="fi" value={ct.notes} onChange={e=>updateContact(i,'notes',e.target.value)} /></div>
                </div>
                <div style={{display:'flex',gap:14,flexWrap:'wrap',paddingTop:4,alignItems:'center'}}>
                  <span style={{fontSize:11,color:'var(--tx3)'}}>送禮：</span>
                  {([['giftMidAutumn','中秋節'],['giftYearEnd','年節禮'],['giftCalendar','桌曆、年曆']] as const).map(([fk,lb])=>(
                    <label key={fk} style={{display:'flex',alignItems:'center',gap:4,fontSize:12,cursor:'pointer'}}>
                      <input type="checkbox" checked={!!(ct as any)[fk]} onChange={e=>updateContact(i, fk as keyof Contact, e.target.checked)} />
                      {lb}
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="fg" style={{marginTop:8}}><label>備註</label><textarea className="dp-note" value={editing.notes||''} onChange={e=>setEditing(p=>({...p,notes:e.target.value}))} /></div>
          </div>
          <div className="mo-ft">
            <button className="btn btn-ghost" onClick={()=>setModalOpen(false)}>取消</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'儲存中…':'儲存'}</button>
          </div>
        </div>
      </div>

      {/* ── 刪除確認 ── */}
      {deleteConfirm && (
        <div className="mo-overlay open" onClick={e=>{if(e.target===e.currentTarget)setDeleteConfirm(null)}}>
          <div className="mo" style={{maxWidth:380}}>
            <div className="mo-hd">
              <h2 style={{color:'var(--rose)'}}>⚠ 確認刪除</h2>
              <button className="dp-close" onClick={()=>setDeleteConfirm(null)}>✕</button>
            </div>
            <div className="mo-body">
              <p style={{fontSize:14,lineHeight:1.8}}>
                確定要刪除「<b>{clients.find(c=>c.id===deleteConfirm)?.name}</b>」？<br/>
                <span style={{color:'var(--tx3)',fontSize:13}}>Notion 資料將被封存，此動作無法復原。</span>
              </p>
            </div>
            <div className="mo-ft">
              <button className="btn btn-ghost" onClick={()=>setDeleteConfirm(null)}>取消</button>
              <button className="btn" style={{background:'var(--rose)',color:'#fff'}} onClick={confirmDelete} disabled={deleting}>
                {deleting ? '刪除中…' : '確認刪除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
