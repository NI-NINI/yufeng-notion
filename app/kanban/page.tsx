'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import type { Case_ } from '@/lib/notion'

const COLUMNS = ['未啟動','進行中','等待中','擱淺','覆核中','已完成']

export default function KanbanPage() {
  const [cases, setCases] = useState<Case_[]>([])
  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState('')

  const load = () => {
    setLoading(true)
    const p = team ? `?team=${team}` : ''
    fetch(`/api/cases${p}`).then(r => r.json()).then(d => { setCases(d); setLoading(false) })
  }
  useEffect(load, [team])

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/cases/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    load()
  }

  const priorityColor: Record<string, string> = { 特急: '#dc2626', 優先: '#f59e0b', 普通: '#6b7280', 緩慢: '#d1d5db' }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>看板</h1>
          <select className="select" style={{ width: 120 }} value={team} onChange={e => setTeam(e.target.value)}>
            <option value="">全部組別</option>
            <option>妮組</option>
            <option>文組</option>
          </select>
        </div>

        {loading ? <div style={{ color: '#888' }}>載入中…</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLUMNS.length}, minmax(220px,1fr))`, gap: 12, overflowX: 'auto' }}>
            {COLUMNS.map(col => {
              const colCases = cases.filter(c => c.status === col)
              return (
                <div key={col}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span className={`badge status-${col}`} style={{ fontSize: 12 }}>{col}</span>
                    <span style={{ fontSize: 12, color: '#888' }}>{colCases.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {colCases.sort((a,b) => {
                      const po = ['特急','優先','普通','緩慢']
                      return po.indexOf(a.priority) - po.indexOf(b.priority)
                    }).map(c => (
                      <div key={c.id} style={{ background: '#fff', border: '1px solid #e8e6e0', borderRadius: 10, padding: 12, fontSize: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>{c.name}</span>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: priorityColor[c.priority] ?? '#ccc', flexShrink: 0, marginTop: 4 }} />
                        </div>
                        {c.clientName && <div style={{ color: '#888', marginBottom: 4 }}>{c.clientName}</div>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#666' }}>{c.assignees.join('/')}</span>
                          <span style={{ color: c.dueDate ? '#555' : '#ccc' }}>{c.dueDate || '無期限'}</span>
                        </div>
                        {c.progressNote && (
                          <div style={{ marginTop: 6, padding: '4px 8px', background: '#f9f8f5', borderRadius: 6, color: '#555', fontSize: 11 }}>
                            {c.progressNote.slice(0,50)}{c.progressNote.length > 50 ? '…' : ''}
                          </div>
                        )}
                        {/* 快速狀態切換 */}
                        <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {COLUMNS.filter(s => s !== col).map(s => (
                            <button key={s} onClick={() => updateStatus(c.id, s)}
                              style={{ fontSize: 10, padding: '2px 6px', border: '1px solid #e0e0e0', borderRadius: 4, background: '#f9f9f9', cursor: 'pointer', color: '#666' }}>
                              → {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
