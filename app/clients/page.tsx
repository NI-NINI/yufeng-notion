'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import type { Client_ } from '@/lib/notion'

const CLIENT_TYPES = ['政府機關', '金融機構', '建設公司', '個人', '其他']

const GIFTS = [
  { key: 'giftDragonBoat', label: '端午' },
  { key: 'giftMidAutumn',  label: '中秋' },
  { key: 'giftNewYear',    label: '春節' },
  { key: 'giftYearEnd',    label: '年節' },
] as const

type GiftKey = typeof GIFTS[number]['key']

interface ExtraContact { name: string; phone: string; email: string }

interface ClientForm extends Partial<Client_> {
  extraContacts?: ExtraContact[]
}

const emptyForm = (): ClientForm => ({
  name: '', taxId: '', phone: '', fax: '', address: '',
  contact1Name: '', contact1Phone: '', contact1Email: '',
  contact2Name: '', contact2Phone: '', contact2Email: '',
  giftDragonBoat: false, giftMidAutumn: false, giftNewYear: false, giftYearEnd: false,
  clientType: '', notes: '',
  extraContacts: [],
})

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client_[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ClientForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [giftFilter, setGiftFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [clientCases, setClientCases] = useState<Record<string, any[]>>({})

  const load = () => {
    setLoading(true)
    fetch('/api/clients').then(r => r.json()).then(d => { setClients(d); setLoading(false) })
  }
  useEffect(load, [])

  const filtered = clients.filter(c => {
    if (search && !c.name.includes(search) && !c.taxId.includes(search)) return false
    if (giftFilter === 'any' && !c.isGiftTarget) return false
    if (giftFilter === 'giftDragonBoat' && !c.giftDragonBoat) return false
    if (giftFilter === 'giftMidAutumn' && !c.giftMidAutumn) return false
    if (giftFilter === 'giftNewYear' && !c.giftNewYear) return false
    if (giftFilter === 'giftYearEnd' && !c.giftYearEnd) return false
    return true
  })

  const loadClientCases = async (clientId: string) => {
    if (clientCases[clientId]) return
    const res = await fetch(`/api/cases?clientId=${clientId}`)
    const data = await res.json()
    setClientCases(prev => ({ ...prev, [clientId]: Array.isArray(data) ? data : [] }))
  }

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
    } else {
      setExpandedId(id)
      loadClientCases(id)
    }
  }

  const save = async () => {
    if (!modal) return
    setSaving(true)
    const body = { ...modal }
    // extra contacts：存進 notes 前面的 JSON 段落（簡單方案，不需改 Notion schema）
    if (modal.id) {
      await fetch(`/api/clients/${modal.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    } else {
      await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setSaving(false); setModal(null); load()
  }

  const del = async (id: string) => {
    if (!confirm('確定刪除此客戶？')) return
    await fetch(`/api/clients/${id}`, { method: 'DELETE' }); load()
  }

  const setF = (k: string, v: any) => setModal(m => m ? { ...m, [k]: v } : m)

  const addExtraContact = () => setModal(m => m ? { ...m, extraContacts: [...(m.extraContacts ?? []), { name: '', phone: '', email: '' }] } : m)
  const updateExtra = (i: number, k: keyof ExtraContact, v: string) =>
    setModal(m => m ? { ...m, extraContacts: m.extraContacts?.map((c, idx) => idx === i ? { ...c, [k]: v } : c) } : m)
  const removeExtra = (i: number) =>
    setModal(m => m ? { ...m, extraContacts: m.extraContacts?.filter((_, idx) => idx !== i) } : m)

  const giftTags = (c: Client_) => {
    const tags = []
    if (c.giftDragonBoat) tags.push('端午')
    if (c.giftMidAutumn)  tags.push('中秋')
    if (c.giftNewYear)    tags.push('春節')
    if (c.giftYearEnd)    tags.push('年節')
    return tags
  }

  const statusColor: Record<string, string> = {
    '進行中': '#dbeafe', '已完成': '#dcfce7', '擱淺': '#fee2e2',
    '等待中': '#fef9c3', '覆核中': '#ffedd5', '已請款': '#e0e7ff',
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>客戶管理</h1>
          <button className="btn btn-primary" onClick={() => setModal(emptyForm())}>＋ 新增客戶</button>
        </div>

        {/* 篩選列 */}
        <div className="card" style={{ marginBottom: 16, padding: '12px 16px' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <input className="input" style={{ width: 200 }} placeholder="搜尋名稱 / 統編" value={search} onChange={e => setSearch(e.target.value)} />
            <select className="select" style={{ width: 130 }} value={giftFilter} onChange={e => setGiftFilter(e.target.value)}>
              <option value="all">全部客戶</option>
              <option value="any">送禮對象</option>
              <option value="giftDragonBoat">端午送禮</option>
              <option value="giftMidAutumn">中秋送禮</option>
              <option value="giftNewYear">春節送禮</option>
              <option value="giftYearEnd">年節送禮</option>
            </select>
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
                    <th>送禮節日</th>
                    <th>備註</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <>
                      <tr key={c.id} style={{ background: c.isGiftTarget ? '#fffbf0' : undefined }}>
                        <td>
                          <button
                            onClick={() => toggleExpand(c.id)}
                            style={{ fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', color: '#1c1c1e', padding: 0, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}
                          >
                            <span style={{ fontSize: 10, color: '#999' }}>{expandedId === c.id ? '▼' : '▶'}</span>
                            {c.name}
                          </button>
                        </td>
                        <td style={{ fontSize: 12, color: '#666' }}>{c.taxId || '—'}</td>
                        <td>{c.clientType ? <span className="badge" style={{ background: '#f0f0f0', color: '#555' }}>{c.clientType}</span> : '—'}</td>
                        <td style={{ fontSize: 12 }}>{c.phone || '—'}</td>
                        <td style={{ fontSize: 12 }}>
                          {c.contact1Name
                            ? <span>{c.contact1Name}{c.contact1Phone ? ` / ${c.contact1Phone}` : ''}</span>
                            : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {giftTags(c).map(t => (
                              <span key={t} style={{ background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: 10, fontSize: 11, fontWeight: 500 }}>{t}</span>
                            ))}
                          </div>
                        </td>
                        <td style={{ fontSize: 12, color: '#888', maxWidth: 150 }}>{c.notes?.slice(0, 40) || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setModal({ ...c, extraContacts: [] })}>編輯</button>
                            <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => del(c.id)}>刪除</button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === c.id && (
                        <tr key={`${c.id}-expand`}>
                          <td colSpan={8} style={{ background: '#f9f8f5', padding: '12px 20px' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#555' }}>
                              {c.name} 的案件
                            </div>
                            {!clientCases[c.id] ? (
                              <div style={{ color: '#aaa', fontSize: 12 }}>載入中…</div>
                            ) : clientCases[c.id].length === 0 ? (
                              <div style={{ color: '#aaa', fontSize: 12 }}>尚無案件</div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {clientCases[c.id].map((cs: any) => (
                                  <div
                                    key={cs.id}
                                    onClick={() => router.push(`/cases?highlight=${cs.id}`)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 10px', background: '#fff', borderRadius: 8, border: '1px solid #ece9e3', cursor: 'pointer' }}
                                  >
                                    <span style={{ fontSize: 11, color: '#aaa', minWidth: 40 }}>#{cs.caseNumber ?? '—'}</span>
                                    <span style={{ fontWeight: 500, fontSize: 13, flex: 1 }}>{cs.name}</span>
                                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: statusColor[cs.status] ?? '#f0f0f0', color: '#555' }}>{cs.status}</span>
                                    <span style={{ fontSize: 12, color: '#888' }}>{cs.dueDate || '—'}</span>
                                    <span style={{ fontSize: 11, color: '#3b82f6' }}>→ 查看</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 編輯 Modal */}
        {modal && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
            <div className="modal" style={{ width: 700 }}>
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

                {/* 聯絡窗口 1 */}
                <div style={{ gridColumn: '1/-1', borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#333' }}>聯絡窗口 1</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div><label className="label">姓名</label><input className="input" value={modal.contact1Name ?? ''} onChange={e => setF('contact1Name', e.target.value)} /></div>
                    <div><label className="label">電話</label><input className="input" value={modal.contact1Phone ?? ''} onChange={e => setF('contact1Phone', e.target.value)} /></div>
                    <div><label className="label">Email</label><input className="input" value={modal.contact1Email ?? ''} onChange={e => setF('contact1Email', e.target.value)} /></div>
                  </div>
                </div>
                {/* 聯絡窗口 2 */}
                <div style={{ gridColumn: '1/-1' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#333' }}>聯絡窗口 2</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div><label className="label">姓名</label><input className="input" value={modal.contact2Name ?? ''} onChange={e => setF('contact2Name', e.target.value)} /></div>
                    <div><label className="label">電話</label><input className="input" value={modal.contact2Phone ?? ''} onChange={e => setF('contact2Phone', e.target.value)} /></div>
                    <div><label className="label">Email</label><input className="input" value={modal.contact2Email ?? ''} onChange={e => setF('contact2Email', e.target.value)} /></div>
                  </div>
                </div>

                {/* 額外聯絡窗口 */}
                {(modal.extraContacts ?? []).map((ec, i) => (
                  <div key={i} style={{ gridColumn: '1/-1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#333' }}>聯絡窗口 {i + 3}</div>
                      <button className="btn btn-danger" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => removeExtra(i)}>移除</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      <div><label className="label">姓名</label><input className="input" value={ec.name} onChange={e => updateExtra(i, 'name', e.target.value)} /></div>
                      <div><label className="label">電話</label><input className="input" value={ec.phone} onChange={e => updateExtra(i, 'phone', e.target.value)} /></div>
                      <div><label className="label">Email</label><input className="input" value={ec.email} onChange={e => updateExtra(i, 'email', e.target.value)} /></div>
                    </div>
                  </div>
                ))}
                <div style={{ gridColumn: '1/-1' }}>
                  <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 12px' }} onClick={addExtraContact}>
                    ＋ 新增聯絡窗口
                  </button>
                </div>

                {/* 四節送禮 */}
                <div style={{ gridColumn: '1/-1', borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                  <label className="label" style={{ marginBottom: 10 }}>節日送禮</label>
                  <div style={{ display: 'flex', gap: 20 }}>
                    {GIFTS.map(g => (
                      <label key={g.key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                        <input type="checkbox" checked={!!(modal as any)[g.key]} onChange={e => setF(g.key, e.target.checked)} />
                        {g.label}
                      </label>
                    ))}
                  </div>
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
