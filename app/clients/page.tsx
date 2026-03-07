'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import type { Client_ } from '@/lib/notion'

const empty: Partial<Client_> = {
  name:'', taxId:'', phone:'', fax:'', address:'',
  contact1Name:'', contact1Phone:'', contact1Email:'',
  contact2Name:'', contact2Phone:'', contact2Email:'',
  isGiftTarget: false, clientType:'', notes:''
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client_[]>([])
  const [loading, setLoading] = useState(true)
  const [det, setDet] = useState<Partial<Client_>|null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [newClient, setNewClient] = useState<Partial<Client_>>({})

  const load = () => {
    setLoading(true)
    fetch('/api/clients').then(r=>r.json()).then(d=>{setClients(d);setLoading(false)})
  }
  useEffect(load, [])

  const filtered = search ? clients.filter(c => c.name.includes(search) || (c.taxId||'').includes(search)) : clients

  const save = async () => {
    if (!det) return; setSaving(true)
    if (det.id) await fetch(`/api/clients/${det.id}`, {method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(det)})
    setSaving(false); setDet(null); load()
  }
  const saveNew = async () => {
    if (!newClient.name) { alert('請填客戶名稱'); return }
    setSaving(true)
    await fetch('/api/clients', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newClient)})
    setSaving(false); setModalOpen(false); setNewClient({}); load()
  }
  const del = async (id: string) => { if(!confirm('確定刪除？'))return; await fetch(`/api/clients/${id}`,{method:'DELETE'}); setDet(null); load() }
  const setD = (k: keyof Client_, v: any) => setDet(d => d ? {...d,[k]:v} : d)
  const setNF = (k: keyof Client_, v: any) => setNewClient(e => ({...e,[k]:v}))

  return (
    <div className="app">
      <Sidebar />
      <div className="main-content">
        <div className="page-hd">
          <h1>客戶管理</h1>
          <div className="page-hd-actions">
            <input className="search-input" placeholder="搜尋客戶…" value={search} onChange={e=>setSearch(e.target.value)} />
            <button className="btn btn-primary" onClick={()=>{setNewClient({...empty});setModalOpen(true)}}>＋ 新增</button>
          </div>
        </div>
        <div className="stat-bar"><span>共 <b>{filtered.length}</b> 家 · 送禮對象 <b>{filtered.filter(c=>c.isGiftTarget).length}</b> 家</span></div>
        <div className="page-ct">
          {loading ? <div style={{padding:48,textAlign:'center',color:'var(--tx3)'}}>載入中…</div> : (
            <table>
              <thead><tr><th>客戶名稱</th><th>統一編號</th><th>電話</th><th>主要聯絡人</th><th>送禮</th></tr></thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} onClick={()=>setDet({...c})}>
                    <td style={{fontWeight:500}}>{c.name}</td>
                    <td style={{fontFamily:'var(--m)',fontSize:12,color:'var(--tx3)'}}>{c.taxId||'—'}</td>
                    <td style={{fontSize:12,color:'var(--tx2)'}}>{c.phone||'—'}</td>
                    <td style={{fontSize:12}}>{c.contact1Name||'—'}{c.contact1Phone?` · ${c.contact1Phone}`:''}</td>
                    <td>{c.isGiftTarget?<span className="tg tg-ok">送禮</span>:<span style={{color:'var(--tx3)'}}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail overlay */}
      <div className={`dov ${det?'open':''}`} onClick={e=>{if(e.target===e.currentTarget){setDet(null)}}}>
        {det && (
          <div className="dp">
            <div className="dp-hd">
              <span style={{fontSize:12,color:'var(--tx3)'}}>客戶資料</span>
              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving?'儲存中':'儲存'}</button>
                <div className="dp-close" onClick={()=>setDet(null)}>✕</div>
              </div>
            </div>
            <div className="dp-body">
              <div className="dp-title">
                <input style={{fontSize:20,fontWeight:700,border:'none',background:'transparent',width:'100%',outline:'none',fontFamily:'var(--f)',color:'var(--tx)'}}
                  value={det.name||''} onChange={e=>setD('name',e.target.value)} />
              </div>
              <div className="dp-grid">
                <div className="dp-gl">統一編號</div><div className="dp-gv"><input className="fi-inline" value={det.taxId||''} onChange={e=>setD('taxId',e.target.value)} /></div>
                <div className="dp-gl">電話</div><div className="dp-gv"><input className="fi-inline" value={det.phone||''} onChange={e=>setD('phone',e.target.value)} /></div>
                <div className="dp-gl">傳真</div><div className="dp-gv"><input className="fi-inline" value={det.fax||''} onChange={e=>setD('fax',e.target.value)} /></div>
                <div className="dp-gl">地址</div><div className="dp-gv"><input className="fi-inline" value={det.address||''} onChange={e=>setD('address',e.target.value)} /></div>
                <div className="dp-gl">送禮對象</div><div className="dp-gv"><label style={{display:'flex',alignItems:'center',gap:6,fontSize:13,fontWeight:400}}><input type="checkbox" checked={!!det.isGiftTarget} onChange={e=>setD('isGiftTarget',e.target.checked)} style={{accentColor:'var(--acc)'}} /> 是</label></div>
              </div>
              <div className="dp-sec"><h3>聯絡窗口 1</h3>
                <div className="dp-grid">
                  <div className="dp-gl">姓名</div><div className="dp-gv"><input className="fi-inline" value={det.contact1Name||''} onChange={e=>setD('contact1Name',e.target.value)} /></div>
                  <div className="dp-gl">電話</div><div className="dp-gv"><input className="fi-inline" value={det.contact1Phone||''} onChange={e=>setD('contact1Phone',e.target.value)} /></div>
                  <div className="dp-gl">Email</div><div className="dp-gv"><input className="fi-inline" value={det.contact1Email||''} onChange={e=>setD('contact1Email',e.target.value)} /></div>
                </div>
              </div>
              <div className="dp-sec"><h3>聯絡窗口 2</h3>
                <div className="dp-grid">
                  <div className="dp-gl">姓名</div><div className="dp-gv"><input className="fi-inline" value={det.contact2Name||''} onChange={e=>setD('contact2Name',e.target.value)} /></div>
                  <div className="dp-gl">電話</div><div className="dp-gv"><input className="fi-inline" value={det.contact2Phone||''} onChange={e=>setD('contact2Phone',e.target.value)} /></div>
                  <div className="dp-gl">Email</div><div className="dp-gv"><input className="fi-inline" value={det.contact2Email||''} onChange={e=>setD('contact2Email',e.target.value)} /></div>
                </div>
              </div>
              <div className="dp-sec"><h3>備註</h3>
                <textarea className="dp-note" style={{width:'100%',resize:'vertical'}} value={det.notes||''} onChange={e=>setD('notes',e.target.value)} />
              </div>
              {det.id && <div className="dp-sec" style={{marginTop:24,paddingTop:16,borderTop:'1px solid var(--bdl)'}}>
                <button className="btn btn-danger btn-sm" onClick={()=>del(det.id!)}>刪除客戶</button>
              </div>}
            </div>
          </div>
        )}
      </div>

      {/* New client modal */}
      {modalOpen && (
        <div className="mov open" onClick={e=>{if(e.target===e.currentTarget){setModalOpen(false);setNewClient({})}}}>
          <div className="mo">
            <div className="mo-hd"><h2>新增客戶</h2><button onClick={()=>setModalOpen(false)}>✕</button></div>
            <div className="mo-body">
              <div className="fg"><label>客戶名稱 *</label><input className="fi" value={newClient.name||''} onChange={e=>setNF('name',e.target.value)} /></div>
              <div className="fr">
                <div className="fg"><label>統一編號</label><input className="fi" value={newClient.taxId||''} onChange={e=>setNF('taxId',e.target.value)} /></div>
                <div className="fg"><label>電話</label><input className="fi" value={newClient.phone||''} onChange={e=>setNF('phone',e.target.value)} /></div>
              </div>
              <div className="fg"><label>地址</label><input className="fi" value={newClient.address||''} onChange={e=>setNF('address',e.target.value)} /></div>
              <div className="fg"><label>聯絡人</label><input className="fi" value={newClient.contact1Name||''} onChange={e=>setNF('contact1Name',e.target.value)} /></div>
              <div className="fg"><label style={{display:'flex',alignItems:'center',gap:6,textTransform:'none',fontWeight:400,fontSize:13}}>
                <input type="checkbox" checked={!!newClient.isGiftTarget} onChange={e=>setNF('isGiftTarget',e.target.checked)} style={{accentColor:'var(--acc)'}} /> 設為送禮對象
              </label></div>
            </div>
            <div className="mo-ft">
              <button className="btn btn-ghost" onClick={()=>{setModalOpen(false);setNewClient({})}}>取消</button>
              <button className="btn btn-primary" onClick={saveNew} disabled={saving}>{saving?'建立中…':'建立'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
