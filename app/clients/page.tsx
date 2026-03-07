'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import type { Client_ } from '@/lib/notion'

const CLIENT_TYPES = ['政府機關','金融機構','建設公司','個人','其他']
const empty: Partial<Client_> = { name: '', taxId: '', phone: '', fax: '', address: '', contact1Name: '', contact1Phone: '', contact1Email: '', contact2Name: '', contact2Phone: '', contact2Email: '', isGiftTarget: false, clientType: '', notes: '' }

export default function ClientsPage() {
  const [clients, setClients] = useState<Client_[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Partial<Client_> | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [giftOnly, setGiftOnly] = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/clients').then(r => r.json()).then(d => { setClients(d); setLoading(false) })
  }
  useEffect(load, [])

  const filtered = clients.filter(c => {
    if (giftOnly && !c.isGiftTarget) return false
    if (search && !c.name.includes(search) && !c.taxId.includes(search)) return false
    return true
  })

  const save = async () => {
    if (!modal) return
    setSaving(true)
    if (modal.id) {
      await fetch(`/api/clients/${modal.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(modal) })
    } else {
      await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(modal) })
    }
    setSaving(false)
    setModal(null)
    load()
  }

  const del = async (id: string) => {
    if (!confirm('確定刪除此客戶？')) return
    await fetch(`/api/clients/${id}`, { method: 'DELETE' })
    load()
  }

  const setF = (k: keyof Client_, v: any) => setModal(m => m ? { ...m, [k]: v } : m)

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>客戶管理</h1>
          <button className="btn btn-primary" onClick={() => setModal({ ...empty })}>＋ 新增客戶</button>
        </div>

        <div className="card" style={{ marginBottom: 16, padding: '12px 16px' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input className="input" style={{ width: 200 }} placeholder="搜尋名稱/統編" value={search} onChange={e => setSearch(e.target.value)} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={giftOnly} onChange={e => setGiftOnly(e.target.checked)} />
              僅顯示送禮對象
            </label>
            <span style={{ fontSize: 13, color: '#888' }}>共 {filtered.length} 筆</span>
          </div>
        </div>

        <div className="card">
          {loading ? <div style={{ color: '#888', padding: 40, textAlign: 'center' }}>載入中…</div> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>委託單位</th>
                    <th>統一編號</th>
                    <th>類型</th>
                    <th>電話</th>
                    <th>聯絡窗口</th>
                    <th>送禮</th>
                    <th>備註</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 500 }}>{c.name}</td>
                      <td style={{ fontSize: 12, color: '#666' }}>{c.taxId || '—'}</td>
                      <td>{c.clientType ? <span className="badge" style={{ background: '#f0f0f0', color: '#555' }}>{c.clientType}</span> : '—'}</td>
                      <td style={{ fontSize: 12 }}>{c.phone || '—'}</td>
                      <td style={{ fontSize: 12 }}>
                        {c.contact1Name ? `${c.contact1Name}${c.contact1Phone ? ` / ${c.contact1Phone}` : ''}` : '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>{c.isGiftTarget ? '是' : ''}</td>
                      <td style={{ fontSize: 12, color: '#888', maxWidth: 150 }}>{c.notes?.slice(0,40) || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setModal(c)}>編輯</button>
                          <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => del(c.id)}>刪除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {modal && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
            <div className="modal">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>{modal.id ? '編輯客戶' : '新增客戶'}</h2>
                <button className="btn btn-ghost" onClick={() => setModal(null)}>✕</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="label">委託單位名稱 *</label>
                  <input className="input" value={modal.name ?? ''} onChange={e => setF('name', e.target.value)} />
                </div>
                <div>
                  <label className="label">統一編號</label>
                  <input className="input" value={modal.taxId ?? ''} onChange={e => setF('taxId', e.target.value)} />
                </div>
                <div>
                  <label className="label">客戶類型</label>
                  <select className="select" value={modal.clientType ?? ''} onChange={e => setF('clientType', e.target.value)}>
                    <option value="">—</option>
                    {CLIENT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">公司電話</label>
                  <input className="input" value={modal.phone ?? ''} onChange={e => setF('phone', e.target.value)} />
                </div>
                <div>
                  <label className="label">傳真</label>
                  <input className="input" value={modal.fax ?? ''} onChange={e => setF('fax', e.target.value)} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="label">公司地址</label>
                  <input className="input" value={modal.address ?? ''} onChange={e => setF('address', e.target.value)} />
                </div>
                <div style={{ gridColumn: '1/-1', borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>聯絡窗口 1</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div><label className="label">姓名</label><input className="input" value={modal.contact1Name ?? ''} onChange={e => setF('contact1Name', e.target.value)} /></div>
                    <div><label className="label">電話</label><input className="input" value={modal.contact1Phone ?? ''} onChange={e => setF('contact1Phone', e.target.value)} /></div>
                    <div><label className="label">Email</label><input className="input" value={modal.contact1Email ?? ''} onChange={e => setF('contact1Email', e.target.value)} /></div>
                  </div>
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>聯絡窗口 2</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div><label className="label">姓名</label><input className="input" value={modal.contact2Name ?? ''} onChange={e => setF('contact2Name', e.target.value)} /></div>
                    <div><label className="label">電話</label><input className="input" value={modal.contact2Phone ?? ''} onChange={e => setF('contact2Phone', e.target.value)} /></div>
                    <div><label className="label">Email</label><input className="input" value={modal.contact2Email ?? ''} onChange={e => setF('contact2Email', e.target.value)} /></div>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={modal.isGiftTarget ?? false} onChange={e => setF('isGiftTarget', e.target.checked)} />
                    <span className="label" style={{ marginBottom: 0 }}>年節送禮對象</span>
                  </label>
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="label">備註</label>
                  <textarea className="input" rows={2} style={{ resize: 'vertical' }} value={modal.notes ?? ''} onChange={e => setF('notes', e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button className="btn btn-ghost" onClick={() => setModal(null)}>取消</button>
                <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? '儲存中…' : '儲存'}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
