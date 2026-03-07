'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import type { Payment_, Case_ } from '@/lib/notion'

const PERIODS = ['第1期','第2期','第3期','第4期','第5期','尾款']
const PAY_STATUSES = ['未請款','可請款','已請款','已收款']
const QUARTERS = ['Q1','Q2','Q3','Q4']

const empty: Partial<Payment_> = { title: '', period: '第1期', status: '未請款', receiptNo: '', notes: '' }

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment_[]>([])
  const [cases, setCases] = useState<Case_[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Partial<Payment_> | null>(null)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/payments').then(r => r.json()),
      fetch('/api/cases').then(r => r.json()),
    ]).then(([p, c]) => { setPayments(p); setCases(c); setLoading(false) })
  }
  useEffect(load, [])

  const filtered = filterStatus ? payments.filter(p => p.status === filterStatus) : payments

  // 統計
  const totalReceivable = payments.reduce((s, p) => s + (p.amount ?? 0), 0)
  const totalReceived = payments.filter(p => p.status === '已收款').reduce((s, p) => s + (p.amount ?? 0), 0)
  const totalPending = payments.filter(p => ['可請款','已請款'].includes(p.status)).reduce((s, p) => s + (p.amount ?? 0), 0)

  const save = async () => {
    if (!modal) return
    setSaving(true)
    // auto-generate title if empty
    const selectedCase = cases.find(c => c.id === modal.caseId)
    const title = modal.title || `${selectedCase?.name ?? '未知案件'} ${modal.period}`
    const payload = { ...modal, title }
    if (modal.id) {
      await fetch(`/api/payments/${modal.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } else {
      await fetch('/api/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    setSaving(false)
    setModal(null)
    load()
  }

  const del = async (id: string) => {
    if (!confirm('確定刪除？')) return
    await fetch(`/api/payments/${id}`, { method: 'DELETE' })
    load()
  }

  const setF = (k: keyof Payment_, v: any) => setModal(m => m ? { ...m, [k]: v } : m)
  const fmt = (n: number) => n >= 10000 ? `$${(n/10000).toFixed(1)}萬` : `$${n.toLocaleString()}`

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>付款管理</h1>
          <button className="btn btn-primary" onClick={() => setModal({ ...empty })}>＋ 新增付款記錄</button>
        </div>

        {/* 統計 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
          {[
            { label: '應收總計', val: fmt(totalReceivable), color: '#1c1c1e' },
            { label: '已收款', val: fmt(totalReceived), color: '#15803d' },
            { label: '可請款/已請款', val: fmt(totalPending), color: '#c2410c' },
          ].map(({ label, val, color }) => (
            <div key={label} className="card">
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color }}>{val}</div>
            </div>
          ))}
        </div>

        {/* 篩選 */}
        <div className="card" style={{ marginBottom: 16, padding: '12px 16px' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <select className="select" style={{ width: 130 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">全部狀態</option>
              {PAY_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="card">
          {loading ? <div style={{ color: '#888', padding: 40, textAlign: 'center' }}>載入中…</div> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>案件</th>
                    <th>期別</th>
                    <th>應收金額</th>
                    <th>收款狀態</th>
                    <th>收據編號</th>
                    <th>請款季別</th>
                    <th>請款日期</th>
                    <th>實收日期</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500, fontSize: 13 }}>{p.caseName || p.title}</td>
                      <td><span className="badge" style={{ background: '#f0f0f0', color: '#555' }}>{p.period}</span></td>
                      <td style={{ fontWeight: 600, color: '#1c1c1e' }}>{p.amount ? fmt(p.amount) : '—'}</td>
                      <td><span className={`badge pay-${p.status}`}>{p.status}</span></td>
                      <td style={{ fontSize: 12, color: '#666' }}>{p.receiptNo || '—'}</td>
                      <td style={{ fontSize: 12 }}>{p.year ? `${p.year} ${p.quarter}` : '—'}</td>
                      <td style={{ fontSize: 12, color: '#666' }}>{p.invoiceDate || '—'}</td>
                      <td style={{ fontSize: 12, color: '#666' }}>{p.receivedDate || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setModal(p)}>編輯</button>
                          <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => del(p.id)}>刪除</button>
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
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>{modal.id ? '編輯付款記錄' : '新增付款記錄'}</h2>
                <button className="btn btn-ghost" onClick={() => setModal(null)}>✕</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="label">所屬案件</label>
                  <select className="select" value={modal.caseId ?? ''} onChange={e => setF('caseId', e.target.value)}>
                    <option value="">— 選擇案件 —</option>
                    {cases.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">期別</label>
                  <select className="select" value={modal.period ?? '第1期'} onChange={e => setF('period', e.target.value)}>
                    {PERIODS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">應收金額（元）</label>
                  <input className="input" type="number" value={modal.amount ?? ''} onChange={e => setF('amount', Number(e.target.value) || null)} />
                </div>
                <div>
                  <label className="label">收款狀態</label>
                  <select className="select" value={modal.status ?? '未請款'} onChange={e => setF('status', e.target.value)}>
                    {PAY_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">收據編號</label>
                  <input className="input" value={modal.receiptNo ?? ''} onChange={e => setF('receiptNo', e.target.value)} />
                </div>
                <div>
                  <label className="label">請款年度</label>
                  <input className="input" type="number" value={modal.year ?? new Date().getFullYear()} onChange={e => setF('year', Number(e.target.value))} />
                </div>
                <div>
                  <label className="label">請款季別</label>
                  <select className="select" value={modal.quarter ?? ''} onChange={e => setF('quarter', e.target.value)}>
                    <option value="">—</option>
                    {QUARTERS.map(q => <option key={q}>{q}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">請款日期</label>
                  <input className="input" type="date" value={modal.invoiceDate ?? ''} onChange={e => setF('invoiceDate', e.target.value)} />
                </div>
                <div>
                  <label className="label">實收日期</label>
                  <input className="input" type="date" value={modal.receivedDate ?? ''} onChange={e => setF('receivedDate', e.target.value)} />
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
