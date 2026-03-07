'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import type { Case_ } from '@/lib/notion'

const ALL_ASSIGNEES = ['慈妮','紘齊','韋萱','文靜','Jenny','旭庭','方謙']
const QUARTERS = ['Q1','Q2','Q3','Q4']
const YEARS = ['2024','2025','2026','2027']

export default function BonusPage() {
  const [cases, setCases] = useState<Case_[]>([])
  const [loading, setLoading] = useState(true)
  const now = new Date()
  const [year, setYear] = useState(`${now.getFullYear()}`)
  const [quarter, setQuarter] = useState(`Q${Math.ceil((now.getMonth()+1)/3)}`)

  useEffect(() => {
    fetch('/api/cases').then(r => r.json()).then(d => { setCases(d); setLoading(false) })
  }, [])

  const eligible = cases.filter(c =>
    c.year === year && c.quarter === quarter &&
    ['已完成','已請款'].includes(c.status)
  )

  const totalContract = eligible.reduce((s, c) => s + (c.contractAmount ?? 0), 0)
  const total25 = eligible.reduce((s, c) => s + (c.bonus25 ?? 0), 0)
  const total15 = eligible.reduce((s, c) => s + (c.bonus15 ?? 0), 0)
  const total3 = eligible.reduce((s, c) => s + (c.bonus3 ?? 0), 0)

  // 每人個人獎金（2.5%均分給承辦人）
  const personBonus: Record<string, number> = {}
  eligible.forEach(c => {
    if (c.assignees.length > 0 && c.bonus25) {
      const share = c.bonus25 / c.assignees.length
      c.assignees.forEach(a => { personBonus[a] = (personBonus[a] ?? 0) + share })
    }
  })

  const fmt = (n: number) => n >= 10000 ? `$${(n/10000).toFixed(1)}萬` : `$${n.toLocaleString()}`

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>獎金試算</h1>
          <div style={{ display: 'flex', gap: 12 }}>
            <select className="select" style={{ width: 100 }} value={year} onChange={e => setYear(e.target.value)}>
              {YEARS.map(y => <option key={y}>{y}</option>)}
            </select>
            <select className="select" style={{ width: 80 }} value={quarter} onChange={e => setQuarter(e.target.value)}>
              {QUARTERS.map(q => <option key={q}>{q}</option>)}
            </select>
          </div>
        </div>

        {loading ? <div style={{ color: '#888' }}>載入中…</div> : (
          <>
            {/* 總覽 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: '合計簽約金額', val: fmt(totalContract), sub: `${eligible.length} 個案件` },
                { label: '個人獎金池（2.5%）', val: fmt(total25), sub: '由各承辦均分' },
                { label: '組控獎金池（1.5%）', val: fmt(total15), sub: '組長分配' },
                { label: '團體獎金池（3%）', val: fmt(total3), sub: '全員分配' },
              ].map(({ label, val, sub }) => (
                <div key={label} className="card">
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: '#1c1c1e' }}>{val}</div>
                  <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>{sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* 個人獎金明細 */}
              <div className="card">
                <div style={{ fontWeight: 600, marginBottom: 12 }}>個人獎金（2.5% 均分）</div>
                {ALL_ASSIGNEES.filter(a => personBonus[a] > 0).length === 0
                  ? <div style={{ color: '#aaa', fontSize: 13 }}>本季無已完成案件</div>
                  : ALL_ASSIGNEES.filter(a => personBonus[a] > 0)
                    .sort((a, b) => (personBonus[b] ?? 0) - (personBonus[a] ?? 0))
                    .map(a => (
                      <div key={a} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <span style={{ fontWeight: 500 }}>{a}</span>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <div style={{ width: 100, background: '#f0f0f0', borderRadius: 4, height: 6 }}>
                            <div style={{ background: '#1d4ed8', width: `${Math.min(100, (personBonus[a] / (total25||1)) * 100)}%`, height: '100%', borderRadius: 4 }} />
                          </div>
                          <span style={{ fontWeight: 600, color: '#15803d' }}>{fmt(personBonus[a] ?? 0)}</span>
                        </div>
                      </div>
                    ))
                }
              </div>

              {/* 案件明細 */}
              <div className="card">
                <div style={{ fontWeight: 600, marginBottom: 12 }}>本季已完成案件（{eligible.length} 件）</div>
                {eligible.length === 0
                  ? <div style={{ color: '#aaa', fontSize: 13 }}>本季無已完成案件</div>
                  : eligible.map(c => (
                    <div key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 500 }}>{c.name}</span>
                        <span style={{ color: '#15803d', fontWeight: 600 }}>{fmt(c.contractAmount ?? 0)}</span>
                      </div>
                      <div style={{ color: '#888', marginTop: 2 }}>
                        {c.assignees.join('/')} · 個人 {fmt(c.bonus25??0)} · 組控 {fmt(c.bonus15??0)} · 團獎 {fmt(c.bonus3??0)}
                      </div>
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
