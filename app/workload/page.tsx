'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import type { Case_ } from '@/lib/notion'

const ALL_ASSIGNEES = ['慈妮','紘齊','韋萱','文靜','Jenny','旭庭','方謙']
const 妮組 = ['慈妮','紘齊','韋萱']
const 文組 = ['文靜','Jenny','旭庭','方謙']

export default function WorkloadPage() {
  const [cases, setCases] = useState<Case_[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cases').then(r => r.json()).then(d => { setCases(d); setLoading(false) })
  }, [])

  const active = cases.filter(c => ['進行中','覆核中','擱淺'].includes(c.status))

  const personData = ALL_ASSIGNEES.map(name => {
    const myCases = active.filter(c => c.assignees.includes(name))
    const weight = myCases.reduce((s, c) => s + (c.difficultyWeight ?? 0), 0)
    return { name, cases: myCases, count: myCases.length, weight }
  })

  const renderGroup = (title: string, members: string[]) => (
    <div className="card" style={{ marginBottom: 20 }}>
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {personData.filter(p => members.includes(p.name)).map(({ name, cases: myCases, count, weight }) => (
          <div key={name} style={{ background: '#f9f8f5', borderRadius: 10, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 600 }}>{name}</span>
              <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: 20 }}>{count} 件</span>
                <span style={{ background: weight > 8 ? '#fee2e2' : weight > 4 ? '#fef9c3' : '#dcfce7', color: weight > 8 ? '#dc2626' : weight > 4 ? '#854d0e' : '#15803d', padding: '2px 8px', borderRadius: 20 }}>難度 {weight.toFixed(1)}</span>
              </div>
            </div>
            <div style={{ background: '#e8e6e0', borderRadius: 4, height: 6, marginBottom: 10 }}>
              <div style={{ background: weight > 8 ? '#dc2626' : weight > 4 ? '#f59e0b' : '#22c55e', width: `${Math.min(100, weight * 8)}%`, height: '100%', borderRadius: 4, transition: 'width 0.3s' }} />
            </div>
            {myCases.length === 0
              ? <div style={{ fontSize: 12, color: '#aaa' }}>目前無進行中案件</div>
              : myCases.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid #ece9e3' }}>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>{c.name}</span>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <span className={`badge status-${c.status}`} style={{ fontSize: 10 }}>{c.status}</span>
                    <span style={{ color: '#888' }}>難{c.difficulty}</span>
                  </div>
                </div>
              ))
            }
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content">
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>負荷分析</h1>
        <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>顯示進行中、覆核中、擱淺案件的人員負荷，用於新案派件判斷</p>
        {loading ? <div style={{ color: '#888' }}>載入中…</div> : (
          <>
            {renderGroup('妮組', 妮組)}
            {renderGroup('文組', 文組)}
          </>
        )}
      </main>
    </div>
  )
}
