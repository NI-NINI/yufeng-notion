'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import type { Case_ } from '@/lib/notion'

export default function StuckPage() {
  const [cases, setCases] = useState<Case_[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetch('/api/cases?status=擱淺').then(r => r.json()).then(d => { setCases(d); setLoading(false) })
  }
  useEffect(load, [])

  const resume = async (c: Case_) => {
    await fetch(`/api/cases/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: '進行中', stuckReason: '' }) })
    load()
  }

  const daysSince = (date: string) => {
    if (!date) return null
    const diff = (Date.now() - new Date(date).getTime()) / 86400000
    return Math.floor(diff)
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content">
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>擱淺追蹤</h1>
        <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>定期檢視哪些案件卡住了，是否需要催辦</p>

        {loading ? <div style={{ color: '#888' }}>載入中…</div> : cases.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 60, color: '#888' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
            <div>目前無擱淺案件</div>
          </div>
        ) : (
          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>案件名稱</th>
                  <th>委託單位</th>
                  <th>組別</th>
                  <th>承辦人</th>
                  <th>派件日</th>
                  <th>擱淺天數</th>
                  <th>擱淺原因</th>
                  <th>進度備註</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cases.map(c => {
                  const days = daysSince(c.assignDate)
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 500 }}>{c.name}</td>
                      <td style={{ color: '#666', fontSize: 12 }}>{c.clientName || '—'}</td>
                      <td><span className={`badge team-${c.team}`}>{c.team}</span></td>
                      <td style={{ fontSize: 12 }}>{c.assignees.join(', ')}</td>
                      <td style={{ fontSize: 12, color: '#666' }}>{c.assignDate || '—'}</td>
                      <td>
                        {days !== null && (
                          <span style={{ color: days > 14 ? '#dc2626' : days > 7 ? '#f59e0b' : '#666', fontWeight: days > 7 ? 700 : 400, fontSize: 13 }}>
                            {days} 天
                          </span>
                        )}
                      </td>
                      <td style={{ color: '#dc2626', fontSize: 12, maxWidth: 200 }}>{c.stuckReason || '未填寫'}</td>
                      <td style={{ color: '#666', fontSize: 12, maxWidth: 160 }}>{c.progressNote?.slice(0,50) || '—'}</td>
                      <td>
                        <button className="btn" style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', fontSize: 12 }} onClick={() => resume(c)}>
                          恢復進行中
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
