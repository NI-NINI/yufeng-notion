'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import type { Case_ } from '@/lib/notion'

const 妮組 = ['慈妮','紘齊','韋萱']
const 文組 = ['文靜','Jenny','旭庭','方謙']
const ALL_ASSIGNEES = [...妮組, ...文組]

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
    const statusLabel = weight > 10 ? '過載' : weight > 6 ? '中等' : '尚可'
    const statusColor = weight > 10 ? '#dc2626' : weight > 6 ? '#d97706' : '#16a34a'
    const statusBg = weight > 10 ? '#fee2e2' : weight > 6 ? '#fef3c7' : '#dcfce7'
    return { name, cases: myCases, count: myCases.length, weight, statusLabel, statusColor, statusBg }
  })

  const renderGroup = (title: string, members: string[], color: string) => {
    const groupData = personData.filter(p => members.includes(p.name))
    const totalCases = groupData.reduce((s, p) => s + p.count, 0)
    const totalWeight = groupData.reduce((s, p) => s + p.weight, 0)
    return (
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 4, height: 20, background: color, borderRadius: 2 }} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#888' }}>
            <span>進行中 <strong style={{ color: '#1a1a1a' }}>{totalCases}</strong> 件</span>
            <span>難度加總 <strong style={{ color: '#1a1a1a' }}>{totalWeight.toFixed(1)}</strong></span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {groupData.map(({ name, cases: myCases, count, weight, statusLabel, statusColor, statusBg }) => (
            <div key={name} style={{ background: '#f9f8f5', borderRadius: 12, padding: 16, border: '1px solid #ece9e3' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>
                    {name.slice(-1)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>進行中 {count} 件 · 難度加總 {weight.toFixed(1)}</div>
                  </div>
                </div>
                <span style={{ background: statusBg, color: statusColor, fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>{statusLabel}</span>
              </div>
              <div style={{ background: '#e8e6e0', borderRadius: 4, height: 6, marginBottom: 12 }}>
                <div style={{ background: statusColor, width: `${Math.min(100, weight * 7)}%`, height: '100%', borderRadius: 4, transition: 'width 0.3s' }} />
              </div>
              {myCases.length === 0
                ? <div style={{ fontSize: 12, color: '#aaa', textAlign: 'center', padding: '8px 0' }}>目前無進行中案件</div>
                : myCases.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '6px 0', borderBottom: '1px solid #ece9e3' }}>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8, color: '#333' }}>{c.name}</span>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <span className={`badge status-${c.status}`} style={{ fontSize: 10 }}>{c.status}</span>
                      <span style={{ color: '#888', fontSize: 11 }}>難{c.difficulty || '—'}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          ))}
        </div>
      </div>
    )
  }

  const totalActive = active.length
  const overloaded = personData.filter(p => p.weight > 10).length

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>案件負荷統計</h1>
          <div style={{ fontSize: 13, color: '#888' }}>僅計入「進行中」案件的負荷</div>
        </div>

        {loading ? <div style={{ color: '#888', padding: 40, textAlign: 'center' }}>載入中…</div> : (
          <>
            {/* 總覽 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: '進行中案件', val: totalActive, unit: '件' },
                { label: '妮組進行中', val: personData.filter(p => 妮組.includes(p.name)).reduce((s,p)=>s+p.count,0), unit: '件' },
                { label: '文組進行中', val: personData.filter(p => 文組.includes(p.name)).reduce((s,p)=>s+p.count,0), unit: '件' },
                { label: '超載人員', val: overloaded, unit: '人', color: overloaded > 0 ? '#dc2626' : '#15803d' },
              ].map(({ label, val, unit, color }) => (
                <div key={label} className="card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: color ?? '#1a1a1a' }}>{val}</div>
                  <div style={{ fontSize: 12, color: '#aaa' }}>{unit}</div>
                </div>
              ))}
            </div>

            {renderGroup('妮組', 妮組, '#3b82f6')}
            {renderGroup('文組', 文組, '#22c55e')}
          </>
        )}
      </main>
    </div>
  )
}
