'use client'
import { useEffect, useState, useRef } from 'react'
import Sidebar from '@/components/Sidebar'

const CLIENT_TYPES = ['政府機關','金融機構','建設公司','個人','其他']
const GIFT_TYPES = [
  { key: 'GiftMidAutumn', field: 'giftMidAutumn', label: '中秋' },
  { key: 'GiftYearEnd',   field: 'giftYearEnd',   label: '年節' },
  { key: 'GiftCalendar',  field: 'giftCalendar',  label: '桌曆' },
] as const

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
      name: g('Name')||'', dept: g('Dept')||'', title: g('Title')||'',
      phone: g('Phone')||'', ext: g('Ext')||'', mobile: g('Mobile')||'',
      email: g('Email')||'', birthday: g('Birthday')||'', notes: g('Notes')||'',
      giftMidAutumn: g('GiftMidAutumn')||false,
      giftYearEnd: g('GiftYearEnd')||false,
      giftCalendar: g('GiftCalendar')||false,
    }
    if (ct.name||ct.phone||ct.email||i===1) cs.push(ct)
  }
  return cs
}

const contactsToPayload = (contacts: Contact[]): Record<string,any> => {
  const out: Record<string,any> = {}
  for (let i = 1; i <= 4; i++) {
    const ct = contacts[i-1] || emptyContact()
    out[`contact${i}Name`]=ct.name; out[`contact${i}Dept`]=ct.dept
    out[`contact${i}Title`]=ct.title; out[`contact${i}Phone`]=ct.phone
    out[`contact${i}Ext`]=ct.ext; out[`contact${i}Mobile`]=ct.mobile
    out[`contact${i}Email`]=ct.email; out[`contact${i}Birthday`]=ct.birthday
    out[`contact${i}Notes`]=ct.notes
    out[`contact${i}GiftMidAutumn`]=ct.giftMidAutumn
    out[`contact${i}GiftYearEnd`]=ct.giftYearEnd
    out[`contact${i}GiftCalendar`]=ct.giftCalendar
  }
  return out
}

const emptyClient = (): Partial<Client> => ({
  name:'', taxId:'', phone:'', fax:'', address:'', clientType:'', notes:'',
  giftMidAutumn:false, giftYearEnd:false, giftCalendar:false,
})

const fmtNo = (n: number|null) => n != null ? `CL-${String(n).padStart(4,'0')}` : '—'

// 送禮標籤
const GiftBadge = ({mid,yr,cal}: {mid:boolean;yr:boolean;cal:boolean}) => (
  <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
    {mid && <span style={{fontSize:10,padding:'1px 5px',borderRadius:3,background:'#fff8e1',border:'1px solid #f9d030',color:'#7a5c00'}}>中秋</span>}
    {yr  && <span style={{fontSize:10,padding:'1px 5px',borderRadius:3,background:'#ffeaea',border:'1px solid #f89898',color:'#8b0000'}}>年節</span>}
    {cal && <span style={{fontSize:10,padding:'1px 5px',borderRadius:3,background:'#e8f4ff',border:'1px solid #7ab8f5',color:'#1a5fa8'}}>桌曆</span>}
  </div>
)

// 送禮篩選表
type GiftKey = 'GiftMidAutumn'|'GiftYearEnd'|'GiftCalendar'
interface GiftRow { clientName:string; clientNo:number|null; name:string; dept:string; title:string; phone:string; mobile:string; email:string }

function buildGiftList(clients: Client[], key: GiftKey): GiftRow[] {
  const rows: GiftRow[] = []
  for (const c of clients) {
    for (let i = 1; i <= 4; i++) {
      if ((c as any)[`contact${i}${key}`]) {
        rows.push({
          clientName:c.name, clientNo:c.clientNo,
          name:(c as any)[`contact${i}Name`]||'',
          dept:(c as any)[`contact${i}Dept`]||'',
          title:(c as any)[`contact${i}Title`]||'',
          phone:(c as any)[`contact${i}Phone`]||'',
          mobile:(c as any)[`contact${i}Mobile`]||'',
          email:(c as any)[`contact${i}Email`]||'',
        })
      }
    }
  }
  return rows
}

export default function ClientsPage() {
  const [giftTab, setGiftTab] = useState<GiftKey|null>(null) // null = 客戶列表
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [giftFilter, setGiftFilter] = useState<GiftKey|''>('')
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
  useEffect(()=>{load()},[])

  const loadCases = async (clientId: string) => {
    if (casesMap[clientId]) return
    const r = await fetch(`/api/cases?clientId=${clientId}`)
    const d = await r.json()
    setCasesMap(prev=>({...prev,[clientId]:Array.isArray(d)?d:[]}))
  }

  const toggleExpand = (id: string) => {
    setExpanded(prev=>{
      const next={...prev,[id]:!prev[id]}
      if (next[id]) loadCases(id)
      return next
    })
  }

  const openNew = () => {
    isNew.current=true
    setEditing(emptyClient())
    setContacts([emptyContact()])
    setModalOpen(true)
  }
  const openEdit = (c: Client) => {
    isNew.current=false
    setEditing({...c})
    const cs=getContacts(c)
    setContacts(cs.length>0?cs:[emptyContact()])
    setModalOpen(true)
  }

  const updateContact = (i:number, field:keyof Contact, val:any) =>
    setContacts(prev=>prev.map((c,idx)=>idx===i?{...c,[field]:val}:c))
  const addContact = () => { if (contacts.length<4) setContacts(prev=>[...prev,emptyContact()]) }
  const removeContact = (i:number) => setContacts(prev=>prev.filter((_,idx)=>idx!==i))

  const save = async () => {
    setSaving(true)
    try {
      const payload = {...editing, ...contactsToPayload(contacts)}
      const method = isNew.current ? 'POST' : 'PATCH'
      const res = await fetch('/api/clients', {method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)})
      if (!res.ok) { const err=await res.json(); alert('儲存失敗：'+err.error); return }
      await load()
      setModalOpen(false)
    } finally { setSaving(false) }
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      await fetch('/api/clients',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:deleteConfirm})})
      await load()
      setDeleteConfirm(null)
    } finally { setDeleting(false) }
  }

  const filtered = clients.filter(c=>{
    if (search && !c.name.includes(search) && !(c.clientNo?.toString().includes(search))) return false
    if (typeFilter && c.clientType!==typeFilter) return false
    if (giftFilter) {
      // 任一窗口有勾就顯示
      const has = [1,2,3,4].some(i=>(c as any)[`contact${i}${giftFilter}`])
      if (!has) return false
    }
    return true
  })

  const giftRows = giftTab ? buildGiftList(filtered, giftTab) : []

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        {/* Header */}
        <div className="page-hd">
          <h1>客戶管理</h1>
          <div className="page-hd-r" style={{gap:8}}>
            <input className="search-input" placeholder="搜尋委託單位…" value={search} onChange={e=>setSearch(e.target.value)} />
            <button className="btn btn-primary btn-sm" onClick={openNew}>＋ 新增客戶</button>
          </div>
        </div>

        {/* 篩選列 */}
        <div className="filter-bar" style={{gap:8,flexWrap:'wrap'}}>
          <div className="filter-chip">
            類型
            <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
              <option value="">全部</option>
              {CLIENT_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="filter-chip">
            送禮篩選
            <select value={giftFilter} onChange={e=>setGiftFilter(e.target.value as any)}>
              <option value="">不篩選</option>
              <option value="GiftMidAutumn">中秋節</option>
              <option value="GiftYearEnd">年節禮</option>
              <option value="GiftCalendar">桌曆年曆</option>
            </select>
          </div>
          {/* 送禮清單快捷按鈕 */}
          <div style={{display:'flex',gap:4,marginLeft:'auto',alignItems:'center'}}>
            <span style={{fontSize:11,color:'var(--tx3)'}}>送禮名單：</span>
            {(['GiftMidAutumn','GiftYearEnd','GiftCalendar'] as GiftKey[]).map((k,i)=>(
              <button key={k} onClick={()=>setGiftTab(giftTab===k?null:k)}
                style={{fontSize:11,padding:'3px 10px',borderRadius:4,border:'1px solid var(--bd)',cursor:'pointer',
                  background:giftTab===k?'var(--blue)':'var(--bgc)',
                  color:giftTab===k?'#fff':'var(--tx2)'}}>
                {['中秋','年節','桌曆'][i]}
              </button>
            ))}
          </div>
        </div>

        {/* 送禮名單（展開顯示在篩選列下方） */}
        {giftTab && (
          <div style={{margin:'0 0 0',borderBottom:'2px solid var(--bd)',background:'var(--bgc)'}}>
            <div style={{padding:'8px 16px 4px',display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:12,fontWeight:700,color:'var(--blue)'}}>
                {giftTab==='GiftMidAutumn'?'🎑 中秋節':giftTab==='GiftYearEnd'?'🧧 年節禮':'📅 桌曆年曆'} 送禮名單
              </span>
              <span style={{fontSize:12,color:'var(--tx3)'}}>共 {giftRows.length} 位</span>
              <button onClick={()=>setGiftTab(null)} style={{marginLeft:'auto',fontSize:11,color:'var(--tx3)',background:'none',border:'none',cursor:'pointer'}}>✕ 收起</button>
            </div>
            <div style={{overflowX:'auto',paddingBottom:8}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead>
                  <tr style={{background:'var(--bgh)'}}>
                    {['委託單位','客戶編號','姓名','部門','職稱','電話','手機','Email'].map(h=>(
                      <th key={h} style={{padding:'6px 12px',textAlign:'left',fontWeight:700,fontSize:10,color:'var(--tx3)',borderBottom:'1px solid var(--bd)',whiteSpace:'nowrap'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {giftRows.length===0
                    ? <tr><td colSpan={8} style={{padding:'12px 16px',color:'var(--tx3)',fontSize:12}}>（此篩選條件下無送禮名單）</td></tr>
                    : giftRows.map((g,i)=>(
                      <tr key={i} style={{borderBottom:'1px solid var(--bd)'}}>
                        <td style={{padding:'6px 12px',fontWeight:600}}>{g.clientName}</td>
                        <td style={{padding:'6px 12px',fontFamily:'var(--m)',color:'var(--tx3)',fontSize:11}}>{fmtNo(g.clientNo)}</td>
                        <td style={{padding:'6px 12px'}}>{g.name||'—'}</td>
                        <td style={{padding:'6px 12px',color:'var(--tx2)'}}>{g.dept||'—'}</td>
                        <td style={{padding:'6px 12px',color:'var(--tx2)'}}>{g.title||'—'}</td>
                        <td style={{padding:'6px 12px',fontFamily:'var(--m)'}}>{g.phone||'—'}</td>
                        <td style={{padding:'6px 12px',fontFamily:'var(--m)'}}>{g.mobile||'—'}</td>
                        <td style={{padding:'6px 12px',color:'var(--blue)',fontSize:11}}>{g.email||'—'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="stat-bar"><span>共 <b>{filtered.length}</b> 家委託單位</span></div>

        {/* 客戶列表 */}
        <div className="scroll-area">
          {/* 表頭 */}
          <div style={{display:'grid',gridTemplateColumns:'88px 1fr 100px 130px 160px 76px',alignItems:'center',padding:'8px 16px',borderBottom:'1px solid var(--bd)',background:'var(--bgh)'}}>
            {['編號','委託單位','統編','公司電話','聯絡窗口',''].map((h,i)=>(
              <span key={i} style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.05em'}}>{h}</span>
            ))}
          </div>

          {loading ? (
            <div className="loading"><div className="spin"/><span>載入中…</span></div>
          ) : filtered.length===0 ? (
            <div className="loading">無符合條件的客戶</div>
          ) : filtered.map(c=>{
            const firstCt = getContacts(c).find(ct=>ct.name||ct.phone)
            const allCts = getContacts(c).filter(ct=>ct.name||ct.phone||ct.mobile||ct.email)
            // 任一窗口有送禮勾選
            const hasGift = [1,2,3,4].some(i=>
              (c as any)[`contact${i}GiftMidAutumn`]||
              (c as any)[`contact${i}GiftYearEnd`]||
              (c as any)[`contact${i}GiftCalendar`]
            )
            return (
              <div key={c.id} className="client-row-wrap">
                <div className="client-hrow" style={{gridTemplateColumns:'88px 1fr 100px 130px 160px 76px'}} onClick={()=>toggleExpand(c.id)}>
                  {/* 編號 */}
                  <span style={{fontSize:11,fontFamily:'var(--m)',color:'var(--tx3)'}}>{fmtNo(c.clientNo)}</span>
                  {/* 委託單位 */}
                  <div style={{display:'flex',alignItems:'center',gap:6,minWidth:0}}>
                    <span style={{fontSize:12,color:'var(--tx3)',transition:'transform .15s',display:'inline-block',flexShrink:0,transform:expanded[c.id]?'rotate(90deg)':''}}>▶</span>
                    <span style={{fontWeight:700,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</span>
                    {c.clientType && <span style={{fontSize:10,padding:'1px 5px',borderRadius:3,background:'var(--bgh)',border:'1px solid var(--bd)',color:'var(--tx3)',flexShrink:0}}>{c.clientType}</span>}
                    {hasGift && <span style={{fontSize:10,padding:'1px 5px',borderRadius:3,background:'#fff8e1',border:'1px solid #f9d030',color:'#7a5c00',flexShrink:0}}>🎁</span>}
                  </div>
                  {/* 統編 */}
                  <span style={{fontSize:12,color:'var(--tx2)',fontFamily:'var(--m)'}}>{c.taxId||'—'}</span>
                  {/* 電話 */}
                  <span style={{fontSize:12,color:'var(--tx2)'}}>{c.phone||'—'}</span>
                  {/* 第一聯絡人摘要 */}
                  <div style={{minWidth:0}}>
                    {firstCt ? (
                      <div style={{fontSize:12,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        <span style={{fontWeight:600}}>{firstCt.name}</span>
                        {firstCt.title && <span style={{color:'var(--tx3)',marginLeft:4,fontSize:11}}>{firstCt.title}</span>}
                        {allCts.length>1 && <span style={{fontSize:10,marginLeft:4,color:'var(--blue)'}}>+{allCts.length-1}</span>}
                      </div>
                    ) : <span style={{fontSize:12,color:'var(--tx3)'}}>—</span>}
                  </div>
                  {/* 操作 */}
                  <div style={{display:'flex',gap:4}}>
                    <button className="btn btn-sm" onClick={e=>{e.stopPropagation();openEdit(c)}}>編輯</button>
                    <button className="btn btn-sm" style={{color:'var(--rose)'}} onClick={e=>{e.stopPropagation();setDeleteConfirm(c.id)}}>刪除</button>
                  </div>
                </div>

                {/* 展開區 */}
                {expanded[c.id] && (
                  <div className="client-expand open">
                    {/* 公司基本資料列 */}
                    {(c.address||c.fax||c.notes) && (
                      <div style={{display:'flex',gap:16,marginBottom:12,fontSize:12,color:'var(--tx2)',flexWrap:'wrap'}}>
                        {c.address && <span>📍 {c.address}</span>}
                        {c.fax && <span>📠 {c.fax}</span>}
                        {c.notes && <span style={{color:'var(--tx3)'}}>📝 {c.notes}</span>}
                      </div>
                    )}

                    {/* 聯絡窗口卡片 */}
                    {allCts.length>0 && (
                      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
                        {allCts.map((ct,i)=>(
                          <div key={i} style={{background:'var(--bgc)',border:'1px solid var(--bd)',borderRadius:6,padding:'10px 12px',fontSize:12,minWidth:190,maxWidth:260,flex:'0 0 auto'}}>
                            <div style={{fontWeight:700,fontSize:13,marginBottom:3}}>{ct.name||`窗口 ${i+1}`}</div>
                            {(ct.dept||ct.title) && (
                              <div style={{color:'var(--tx3)',fontSize:11,marginBottom:4}}>{[ct.dept,ct.title].filter(Boolean).join(' · ')}</div>
                            )}
                            {ct.phone && <div style={{color:'var(--tx2)'}}>📞 {ct.phone}{ct.ext?` #${ct.ext}`:''}</div>}
                            {ct.mobile && <div style={{color:'var(--tx2)'}}>📱 {ct.mobile}</div>}
                            {ct.email && <div style={{color:'var(--blue)',fontSize:11}}>✉ {ct.email}</div>}
                            {ct.birthday && <div style={{color:'var(--tx3)',fontSize:11}}>🎂 {ct.birthday}</div>}
                            <GiftBadge mid={ct.giftMidAutumn} yr={ct.giftYearEnd} cal={ct.giftCalendar} />
                            {ct.notes && <div style={{color:'var(--tx3)',marginTop:4,paddingTop:4,borderTop:'1px solid var(--bd)',fontSize:11}}>{ct.notes}</div>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 旗下案件 */}
                    <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.04em'}}>案件</div>
                    {!casesMap[c.id] ? (
                      <div style={{fontSize:12,color:'var(--tx3)'}}>載入中…</div>
                    ) : casesMap[c.id].length===0 ? (
                      <div style={{fontSize:12,color:'var(--tx3)'}}>尚無案件</div>
                    ) : casesMap[c.id].map((cs:any)=>(
                      <a key={cs.id} href={`/cases?highlight=${cs.id}`}
                        style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 12px',background:'var(--bgc)',border:'1px solid var(--bd)',borderRadius:6,marginBottom:4,fontSize:13,cursor:'pointer',textDecoration:'none'}}>
                        <span>
                          <b>{cs.name}</b>
                          {cs.caseNumber && <span style={{color:'var(--tx3)',fontFamily:'var(--m)',fontSize:11,marginLeft:6}}>#{cs.caseNumber}</span>}
                        </span>
                        <div style={{display:'flex',gap:8,alignItems:'center'}}>
                          <span className={`st ${cs.status==='進行中'?'st-a':cs.status==='已完成'?'st-d':'st-r'}`}>{cs.status}</span>
                          {cs.contractAmount && <span style={{fontFamily:'var(--m)',fontSize:11,color:'var(--tx2)'}}>$ {cs.contractAmount.toLocaleString()}</span>}
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 新增/編輯 Modal */}
      <div className={`mo-overlay ${modalOpen?'open':''}`} onClick={e=>{if(e.target===e.currentTarget)setModalOpen(false)}}>
        <div className="mo" style={{maxWidth:700}}>
          <div className="mo-hd">
            <h2>{isNew.current?'新增客戶':'編輯客戶'}</h2>
            <button className="dp-close" onClick={()=>setModalOpen(false)}>✕</button>
          </div>
          <div className="mo-body">
            <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>基本資料</div>
            <div className="row2">
              <div className="fg"><label>委託單位 *</label><input className="fi" value={editing.name||''} onChange={e=>setEditing(p=>({...p,name:e.target.value}))} /></div>
              <div className="fg">
                <label>客戶類型</label>
                <select className="fi" value={editing.clientType||''} onChange={e=>setEditing(p=>({...p,clientType:e.target.value}))}>
                  <option value="">— 選擇 —</option>
                  {CLIENT_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:8}}>
              <div className="fg"><label>統一編號</label><input className="fi" value={editing.taxId||''} onChange={e=>setEditing(p=>({...p,taxId:e.target.value}))} /></div>
              <div className="fg"><label>公司電話</label><input className="fi" value={editing.phone||''} onChange={e=>setEditing(p=>({...p,phone:e.target.value}))} /></div>
              <div className="fg"><label>傳真</label><input className="fi" value={editing.fax||''} onChange={e=>setEditing(p=>({...p,fax:e.target.value}))} /></div>
            </div>
            <div className="fg" style={{marginBottom:12}}><label>公司地址</label><input className="fi" value={editing.address||''} onChange={e=>setEditing(p=>({...p,address:e.target.value}))} /></div>

            {/* 聯絡窗口 */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.05em'}}>聯絡窗口</div>
              {contacts.length<4 && <button className="btn btn-sm" onClick={addContact}>＋ 新增窗口</button>}
            </div>
            {contacts.map((ct,i)=>(
              <div key={i} style={{border:'1px solid var(--bd)',borderRadius:8,padding:12,marginBottom:8}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <span style={{fontSize:12,fontWeight:700,color:'var(--tx2)'}}>窗口 {i+1}</span>
                  {i>=1 && <button style={{fontSize:11,color:'var(--rose)',cursor:'pointer',background:'none',border:'none'}} onClick={()=>removeContact(i)}>✕ 移除</button>}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:8}}>
                  <div className="fg"><label>姓名</label><input className="fi" value={ct.name} onChange={e=>updateContact(i,'name',e.target.value)} /></div>
                  <div className="fg"><label>部門</label><input className="fi" value={ct.dept} onChange={e=>updateContact(i,'dept',e.target.value)} /></div>
                  <div className="fg"><label>職稱</label><input className="fi" value={ct.title} onChange={e=>updateContact(i,'title',e.target.value)} /></div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:8}}>
                  <div className="fg"><label>電話</label><input className="fi" value={ct.phone} onChange={e=>updateContact(i,'phone',e.target.value)} /></div>
                  <div className="fg"><label>分機</label><input className="fi" value={ct.ext} onChange={e=>updateContact(i,'ext',e.target.value)} /></div>
                  <div className="fg"><label>手機</label><input className="fi" value={ct.mobile} onChange={e=>updateContact(i,'mobile',e.target.value)} /></div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:8}}>
                  <div className="fg"><label>Email</label><input className="fi" type="email" value={ct.email} onChange={e=>updateContact(i,'email',e.target.value)} /></div>
                  <div className="fg"><label>生日（月/日）</label><input className="fi" placeholder="MM/DD" value={ct.birthday} onChange={e=>updateContact(i,'birthday',e.target.value)} /></div>
                  <div className="fg"><label>備註</label><input className="fi" value={ct.notes} onChange={e=>updateContact(i,'notes',e.target.value)} /></div>
                </div>
                <div style={{display:'flex',gap:14,alignItems:'center',paddingTop:2}}>
                  <span style={{fontSize:11,color:'var(--tx3)'}}>送禮：</span>
                  {GIFT_TYPES.map(g=>(
                    <label key={g.key} style={{display:'flex',alignItems:'center',gap:4,fontSize:12,cursor:'pointer'}}>
                      <input type="checkbox" checked={!!(ct as any)[g.field]} onChange={e=>updateContact(i,g.field as keyof Contact,e.target.checked)} />
                      {g.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="fg" style={{marginTop:4}}><label>備註</label><textarea className="dp-note" value={editing.notes||''} onChange={e=>setEditing(p=>({...p,notes:e.target.value}))} /></div>
          </div>
          <div className="mo-ft">
            <button className="btn btn-ghost" onClick={()=>setModalOpen(false)}>取消</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'儲存中…':'儲存'}</button>
          </div>
        </div>
      </div>

      {/* 刪除確認 */}
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
                {deleting?'刪除中…':'確認刪除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
