'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import type { Case_ } from '@/lib/notion'
import Link from 'next/link'

const STATUS_ORDER = ['未啟動','進行中','等待中','擱淺','覆核中','已完成','已請款']

function thisWeek(): [string, string] {
  const now = new Date()
  const day = now.getDay() // 0=sun
  const mon = new Date(now); mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
  return [mon.toISOString().slice(0,10), sun.toISOString().slice(0,10)]
}

export default function Dashboard() {
  const [cases, setCases] = useState<Case_[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cases').then(r => r.json()).then(d => { setCases(d); setLoading(false) })
  }, [])

  const active = cases.filter(c => !['已完成','已請款'].includes(c.status))
  const [mon, sun] = thisWeek()
  const thisWeekOut = cases.filter(c =>
    ['進行中','覆核中'].includes(c.status) &&
    c.dueDate >= mon && c.dueDate <= sun
  )
  const stuck = cases.filter(c => c.status === '擱淺')
  const inReview = cases.filter(c => c.status === '覆核中')

  // 本季獎金
  const now = new Date()
  const currentQ = `Q${Math.ceil((now.getMonth()+1)/3)}`
  const currentYear = `${now.getFullYear()}`
  const thisQCases = cases.filter(c => c.quarter === currentQ && c.year === currentYear && ['已完成','已請款'].includes(c.status))
  const bonusTotal = thisQCases.reduce((s, c) => s + (c.bonus25 ?? 0) + (c.bonus15 ?? 0) + (c.bonus3 ?? 0), 0)

  // 人員負荷
  const loadMap: Record<string, { count: number, weight: number }> = {}
  active.forEach(c => {
    c.assignees.forEach(a => {
      if (!loadMap[a]) loadMap[a] = { count: 0, weight: 0 }
      loadMap[a].count++
      loadMap[a].weight += c.difficultyWeight ?? 0
    })
  })

  const statCard = (title: string, value: number | string, color: string, sub?: string, href?: string) => (
    <div className="card" style={{ flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>{sub}</div>}
      {href && <Link href={href} style={{ fontSize: 12, color: '#1d4ed8', marginTop: 8, display: 'block' }}>查看 →</Link>}
    </div>
  )

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>儀表板</h1>
          <p style={{ fontSize: 13, color: '#888' }}>本週 {mon} ～ {sun}</p>
        </div>

        {loading ? (
          <div style={{ color: '#888' }}>載入中…</div>
        ) : (
          <>
            {/* 統計卡片 */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
              {statCard('進行中案件', active.length, '#1d4ed8', '不含已完成/已請款', '/cases')}
              {statCard('本週應出件', thisWeekOut.length, thisWeekOut.length > 0 ? '#c2410c' : '#15803d', '進行中+覆核中', '/cases')}
              {statCard('擱淺案件', stuck.length, stuck.length > 0 ? '#dc2626' : '#15803d', '需要關注', '/stuck')}
              {statCard('覆核中', inReview.length, '#c2410c', '等待出件', '/cases')}
              {statCard(`${currentYear} ${currentQ} 獎金`, `$${(bonusTotal/10000).toFixed(1)}萬`, '#15803d', '已完成案件', '/bonus')}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* 本週出件 */}
              <div className="card">
                <div style={{ fontWeight: 600, marginBottom: 12 }}>📅 本週應出件（{thisWeekOut.length} 件）</div>
                {thisWeekOut.length === 0
                  ? <div style={{ color: '#aaa', fontSize: 13 }}>本週無待出件案件</div>
                  : thisWeekOut.sort((a,b) => a.dueDate.localeCompare(b.dueDate)).map(c => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                      <div>
                        <span style={{ fontWeight: 500 }}>{c.name}</span>
                        <span style={{ color: '#888', marginLeft: 8 }}>{c.assignees.join('/')}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span className={`badge status-${c.status}`}>{c.status}</span>
                        <span style={{ color: '#888', fontSize: 12 }}>{c.dueDate}</span>
                      </div>
                    </div>
                  ))
                }
              </div>

              {/* 人員負荷 */}
              <div className="card">
                <div style={{ fontWeight: 600, marginBottom: 12 }}>⚖️ 人員負荷</div>
                {Object.entries(loadMap).sort((a,b) => b[1].weight - a[1].weight).map(([name, { count, weight }]) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', fontSize: 13 }}>
                    <div style={{ width: 48, fontWeight: 500 }}>{name}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ background: '#f0f0f0', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                        <div style={{ background: weight > 8 ? '#dc2626' : weight > 4 ? '#f59e0b' : '#22c55e', width: `${Math.min(100, weight * 10)}%`, height: '100%' }} />
                      </div>
                    </div>
                    <div style={{ color: '#666', fontSize: 12 }}>{count}件 / 難度{weight.toFixed(1)}</div>
                  </div>
                ))}
              </div>

              {/* 狀態分布 */}
              <div className="card">
                <div style={{ fontWeight: 600, marginBottom: 12 }}>📊 案件狀態分布</div>
                {STATUS_ORDER.map(s => {
                  const cnt = cases.filter(c => c.status === s).length
                  if (cnt === 0) return null
                  return (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, fontSize: 13 }}>
                      <span className={`badge status-${s}`} style={{ minWidth: 64, justifyContent: 'center' }}>{s}</span>
                      <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 4, height: 6 }}>
                        <div style={{ background: '#1d4ed8', width: `${(cnt / cases.length) * 100}%`, height: '100%', borderRadius: 4 }} />
                      </div>
                      <span style={{ color: '#666', minWidth: 24, textAlign: 'right' }}>{cnt}</span>
                    </div>
                  )
                })}
              </div>

              {/* 擱淺案件 */}
              <div className="card">
                <div style={{ fontWeight: 600, marginBottom: 12 }}>🔴 擱淺追蹤（{stuck.length} 件）</div>
                {stuck.length === 0
                  ? <div style={{ color: '#aaa', fontSize: 13 }}>目前無擱淺案件 🎉</div>
                  : stuck.map(c => (
                    <div key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                      <div style={{ fontWeight: 500 }}>{c.name}</div>
                      <div style={{ color: '#dc2626', fontSize: 12, marginTop: 2 }}>{c.stuckReason || '原因未填寫'}</div>
                      <div style={{ color: '#888', fontSize: 12 }}>{c.assignees.join('/')} · 派件 {c.assignDate}</div>
                    </div>
                  ))
                }
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
