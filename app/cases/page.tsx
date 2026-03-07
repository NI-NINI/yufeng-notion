'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import type { Case_, Client_ } from '@/lib/notion'

const CASE_TYPES = ['土地估價','建物估價','都市更新','權利變換','聯合貸款','法拍鑑價','資產重估','租金評估','國產署','其他']
const STATUSES = ['未啟動','進行中','等待中','擱淺','覆核中','已完成','已請款']
const PRIORITIES = ['特急','優先','普通','緩慢']
const TEAMS = ['妮組','文組','未派']
const ASSIGNEES_妮組 = ['慈妮','紘齊','韋萱']
const ASSIGNEES_文組 = ['文靜','Jenny','旭庭','方謙']
const ALL_ASSIGNEES = [...ASSIGNEES_妮組, ...ASSIGNEES_文組]
const APPRAISERS = ['博宇','慈妮','文靜','所長']
const DIFFICULTIES = ['1','2','3','4','5']

const empty: Partial<Case_> = {
  name: '', caseType: '', address: '', team: '未派', status: '未啟動',
  priority: '普通', assignees: [], appraisers: [], difficulty: '',
  stuckReason: '', progressNote: '', documentNotes: '',
}

export default function CasesPage() {
  const [cases, setCases] = useState<Case_[]>([])
  const [clients, setClients] = useState<Client_[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Partial<Case_> | null>(null)
  const [saving, setSaving] = useState(false)
  const [filterTeam, setFilterTeam] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterAssignee, setFilterAssignee] = useState('')
  const [search, setSearch] = useState('')

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterTeam) params.set('team', filterTeam)
    if (filterStatus) params.set('status', filterStatus)
    if (filterAssignee) params.set('assignee', filterAssignee)
    fetch(`/api/cases?${params}`).then(r => r.json()).then(d => { setCases(d); setLoading(false) })
  }

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(setClients)
  }, [])
  useEffect(load, [filterTeam, filterStatus, filterAssignee])

  const filtered = cases.filter(c =>
    !search || c.name.includes(search) || c.clientName.includes(search) || c.address.includes(search)
  )

  const save = async () => {
    if (!modal) return
    setSaving(true)
    if (modal.id) {
      await fetch(`/api/cases/${modal.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(modal) })
    } else {
      await fetch('/api/cases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(modal) })
    }
    setSaving(false)
    setModal(null)
    load()
  }

  const del = async (id: string) => {
    if (!confirm('確定要刪除此案件？')) return
    await fetch(`/api/cases/${id}`, { method: 'DELETE' })
    load()
  }

  const setField = (key: keyof Case_, val: any) => setModal(m => m ? { ...m, [key]: val } : m)

  // 出件日前3天標示
  const isDueSoon = (dueDate: string) => {
    if (!dueDate) return false
    const diff = (new Date(dueDate).getTime() - Date.now()) / 86400000
    return diff >= 0 && diff <= 3
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>案件管理</h1>
          <button className="btn btn-primary" onClick={() => setModal({ ...empty })}>＋ 新增案件</button>
        </div>

        {/* 篩選列 */}
        <div className="card" style={{ marginBottom: 16, padding: '12px 16px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <input className="input" style={{ width: 200 }} placeholder="搜尋案件名稱/客戶/地址" value={search} onChange={e => setSearch(e.target.value)} />
            <select className="select" style={{ width: 100 }} value={filterTeam} onChange={e => setFilterTeam(e.target.value)}>
              <option value="">全部組別</option>
              {TEAMS.map(t => <option key={t}>{t}</option>)}
            </select>
            <select className="select" style={{ width: 110 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">全部狀態</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="select" style={{ width: 100 }} value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
              <option value="">全部承辦</option>
              {ALL_ASSIGNEES.map(a => <option key={a}>{a}</option>)}
            </select>
            <span style={{ fontSize: 13, color: '#888' }}>共 {filtered.length} 件</span>
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div style={{ color: '#888', padding: 40, textAlign: 'center' }}>載入中…</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>編號</th>
                    <th>案件名稱</th>
                    <th>委託單位</th>
                    <th>類型</th>
                    <th>組別</th>
                    <th>承辦</th>
                    <th>狀態</th>
                    <th>順位</th>
                    <th>預計交件</th>
                    <th>難度</th>
                    <th>簽約金額</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id}>
                      <td style={{ color: '#888', fontSize: 11 }}>YF-{c.caseNumber ?? '—'}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{c.name}</div>
                        {c.progressNote && <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{c.progressNote.slice(0,40)}{c.progressNote.length > 40 ? '…' : ''}</div>}
                      </td>
                      <td style={{ color: '#555', fontSize: 12 }}>{c.clientName || '—'}</td>
                      <td><span style={{ fontSize: 12 }}>{c.caseType}</span></td>
                      <td><span className={`badge team-${c.team}`}>{c.team}</span></td>
                      <td style={{ fontSize: 12 }}>{c.assignees.join(', ') || '—'}</td>
                      <td><span className={`badge status-${c.status}`}>{c.status}</span></td>
                      <td><span className={`badge priority-${c.priority}`}>{c.priority}</span></td>
                      <td>
                        <span style={{ fontSize: 12, color: isDueSoon(c.dueDate) ? '#dc2626' : '#555', fontWeight: isDueSoon(c.dueDate) ? 700 : 400 }}>
                          {isDueSoon(c.dueDate) && '🔴 '}{c.dueDate || '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontSize: 13 }}>{c.difficulty || '—'}</td>
                      <td style={{ fontSize: 12 }}>
                        {c.contractAmount ? `$${(c.contractAmount/10000).toFixed(1)}萬` : '—'}
                      </td>
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

        {/* Modal */}
        {modal && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
            <div className="modal">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>{modal.id ? '編輯案件' : '新增案件'}</h2>
                <button className="btn btn-ghost" onClick={() => setModal(null)}>✕</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="label">案件名稱 *</label>
                  <input className="input" value={modal.name ?? ''} onChange={e => setField('name', e.target.value)} placeholder="例：中山區商辦估價" />
                </div>
                <div>
                  <label className="label">委託單位</label>
                  <select className="select" value={modal.clientId ?? ''} onChange={e => setField('clientId', e.target.value)}>
                    <option value="">— 選擇客戶 —</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">案件類型</label>
                  <select className="select" value={modal.caseType ?? ''} onChange={e => setField('caseType', e.target.value)}>
                    <option value="">—</option>
                    {CASE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="label">標的地址</label>
                  <input className="input" value={modal.address ?? ''} onChange={e => setField('address', e.target.value)} />
                </div>
                <div>
                  <label className="label">簽約金額（元）</label>
                  <input className="input" type="number" value={modal.contractAmount ?? ''} onChange={e => setField('contractAmount', Number(e.target.value) || null)} />
                </div>
                <div>
                  <label className="label">折扣比例（預設100）</label>
                  <input className="input" type="number" value={modal.discountRate ?? 100} onChange={e => setField('discountRate', Number(e.target.value))} />
                </div>
                <div>
                  <label className="label">簽約日期</label>
                  <input className="input" type="date" value={modal.contractDate ?? ''} onChange={e => setField('contractDate', e.target.value)} />
                </div>
                <div>
                  <label className="label">預定完成日</label>
                  <input className="input" type="date" value={modal.plannedDate ?? ''} onChange={e => setField('plannedDate', e.target.value)} />
                </div>
                <div>
                  <label className="label">負責組別</label>
                  <select className="select" value={modal.team ?? '未派'} onChange={e => setField('team', e.target.value)}>
                    {TEAMS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">順位</label>
                  <select className="select" value={modal.priority ?? '普通'} onChange={e => setField('priority', e.target.value)}>
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">案件狀態</label>
                  <select className="select" value={modal.status ?? '未啟動'} onChange={e => setField('status', e.target.value)}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">案件難度（1-5）</label>
                  <select className="select" value={modal.difficulty ?? ''} onChange={e => setField('difficulty', e.target.value)}>
                    <option value="">—</option>
                    {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">承辦人</label>
                  <select className="select" value={''} onChange={e => {
                    const v = e.target.value
                    if (!v) return
                    const curr = modal.assignees ?? []
                    setField('assignees', curr.includes(v) ? curr.filter(a => a !== v) : [...curr, v])
                  }}>
                    <option value="">— 點選新增 —</option>
                    {ALL_ASSIGNEES.map(a => <option key={a}>{a}</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                    {(modal.assignees ?? []).map(a => (
                      <span key={a} className="badge" style={{ background: '#dbeafe', color: '#1d4ed8', cursor: 'pointer' }} onClick={() => setField('assignees', (modal.assignees ?? []).filter(x => x !== a))}>
                        {a} ✕
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">簽證估價師</label>
                  <select className="select" value={''} onChange={e => {
                    const v = e.target.value
                    if (!v) return
                    const curr = modal.appraisers ?? []
                    setField('appraisers', curr.includes(v) ? curr.filter(a => a !== v) : [...curr, v])
                  }}>
                    <option value="">— 點選新增 —</option>
                    {APPRAISERS.map(a => <option key={a}>{a}</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                    {(modal.appraisers ?? []).map(a => (
                      <span key={a} className="badge" style={{ background: '#f3e8ff', color: '#7e22ce', cursor: 'pointer' }} onClick={() => setField('appraisers', (modal.appraisers ?? []).filter(x => x !== a))}>
                        {a} ✕
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">派件日</label>
                  <input className="input" type="date" value={modal.assignDate ?? ''} onChange={e => setField('assignDate', e.target.value)} />
                </div>
                <div>
                  <label className="label">預計交件日</label>
                  <input className="input" type="date" value={modal.dueDate ?? ''} onChange={e => setField('dueDate', e.target.value)} />
                </div>
                {modal.status === '擱淺' && (
                  <div style={{ gridColumn: '1/-1' }}>
                    <label className="label">擱淺原因</label>
                    <input className="input" value={modal.stuckReason ?? ''} onChange={e => setField('stuckReason', e.target.value)} />
                  </div>
                )}
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="label">進度備註（承辦↔組長溝通）</label>
                  <textarea className="input" rows={3} style={{ resize: 'vertical' }} value={modal.progressNote ?? ''} onChange={e => setField('progressNote', e.target.value)} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="label">文件備註（需檢附文件）</label>
                  <textarea className="input" rows={2} style={{ resize: 'vertical' }} value={modal.documentNotes ?? ''} onChange={e => setField('documentNotes', e.target.value)} />
                </div>
                {modal.id && (
                  <div>
                    <label className="label">品質分數（完成後評分 1-10）</label>
                    <input className="input" type="number" min={1} max={10} value={modal.qualityScore ?? ''} onChange={e => setField('qualityScore', Number(e.target.value) || null)} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button className="btn btn-ghost" onClick={() => setModal(null)}>取消</button>
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  {saving ? '儲存中…' : '儲存'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
