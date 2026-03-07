'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import type { Case_ } from '@/lib/notion'

const 妮組Members = ['慈妮','紘齊','韋萱']
const 文組Members = ['文靜','Jenny','旭庭','方謙']
const ALL_ASSIGNEES = [...妮組Members, ...文組Members]
const QUARTERS = ['Q1','Q2','Q3','Q4']
const YEARS = ['2024','2025','2026','2027']

export default function BonusPage() {
  const [cases, setCases] = useState<Case_[]>([])
  const [loading, setLoading] = useState(true)
  const now = new Date()
  const [year, setYear] = useState(`${now.getFullYear()}`)
  const [quarter, setQuarter] = useState(`Q${Math.ceil((now.getMonth()+1)/3)}`)
  const [teamBonus, setTeamBonus] = useState<Record<string, Record<string, number>>>({
    妮組: { 慈妮: 0, 紘齊: 0, 韋萱: 0 },
    文組: { 文靜: 0, Jenny: 0, 旭庭: 0, 方謙: 0 },
  })

  useEffect(() => {
    fetch('/api/cases').then(r => r.json()).then(d => { setCases(d); setLoading(false) })
  }, [])

  const eligible = cases.filter(c =>
    c.year === year && c.quarter === quarter && ['已完成','已請款'].includes(c.status)
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

  // 妮組/文組池
  const 妮池 = eligible.filter(c => c.team === '妮組').reduce((s,c)=>s+(c.bonus3??0),0)
  const 文池 = eligible.filter(c => c.team === '文組').reduce((s,c)=>s+(c.bonus3??0),0)

  const updateTeamBonus = (group: string, name: string, val: number) => {
    setTeamBonus(prev => ({ ...prev, [group]: { ...prev[group], [name]: val } }))
  }

  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`

  const renderTeamPool = (group: string, members: string[], pool: number) => {
    const allocated = Object.values(teamBonus[group]).reduce((s, v) => s + v, 0)
    const remaining = pool - allocated
    return (
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: group === '妮組' ? '#3b82f6' : '#22c55e', marginRight: 8 }} />
            {group} 團體獎金池 {fmt(pool)}
          </div>
          <div style={{ fontSize: 12 }}>
            <span style={{ color: '#888' }}>已分配 {Math.round(allocated/pool*100)||0}%</span>
            <span style={{ margin: '0 6px', color: '#ddd' }}>|</span>
            <span style={{ color: remaining < 0 ? '#dc2626' : '#15803d', fontWeight: 600 }}>剩餘 {fmt(remaining)}</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${members.length}, 1fr)`, gap: 10 }}>
          {members.map(name => {
            const val = teamBonus[group][name] ?? 0
            const pct = pool > 0 ? Math.round(val / pool * 100) : 0
            return (
              <div key={name} style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>{name}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="number" min={0} value={val} onChange={e => updateTeamBonus(group, name, Number(e.target.value))}
                    className="input" style={{ width: '100%', padding: '6px 8px', fontSize: 13 }} />
                </div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>個人 {fmt(personBonus[name] ?? 0)} + 團獎 {fmt(val)} = <strong>{fmt((personBonus[name]??0)+val)}</strong> ({pct}%)</div>
              </div>
            )
          })}
        </div>
        {remaining < 0 && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 8 }}>⚠ 已超過獎金池上限 {fmt(Math.abs(remaining))}</div>}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>獎金配發</h1>
          <div style={{ display: 'flex', gap: 12 }}>
            <select className="select" style={{ width: 90 }} value={year} onChange={e => setYear(e.target.value)}>
              {YEARS.map(y => <option key={y}>{y}</option>)}
            </select>
            <select className="select" style={{ width: 80 }} value={quarter} onChange={e => setQuarter(e.target.value)}>
              {QUARTERS.map(q => <option key={q}>{q}</option>)}
            </select>
          </div>
        </div>

        {loading ? <div style={{ color: '#888', padding: 40, textAlign: 'center' }}>載入中…</div> : (
          <>
            {/* 總覽 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: '合計簽約金額', val: fmt(totalContract), sub: `${eligible.length} 件` },
                { label: '個人獎金池 2.5%', val: fmt(total25), sub: '承辦人均分' },
                { label: '組控獎金池 1.5%', val: fmt(total15), sub: '組長分配' },
                { label: '團體獎金池 3%', val: fmt(total3), sub: '季末由組長配發', highlight: true },
              ].map(({ label, val, sub, highlight }) => (
                <div key={label} className="card">
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: highlight ? '#d97706' : '#1c1c1e' }}>{val}</div>
                  <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>{sub}</div>
                </div>
              ))}
            </div>

            {/* 個人固定獎金 */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>個人固定獎金（承辦 2.5%）</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                {ALL_ASSIGNEES.filter(a => (personBonus[a] ?? 0) > 0).map(a => (
                  <div key={a} style={{ padding: '12px 14px', background: '#f9f8f5', borderRadius: 10, border: '1px solid #ece9e3' }}>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{a}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#15803d' }}>{fmt(personBonus[a])}</div>
                    <div style={{ background: '#e8e6e0', borderRadius: 4, height: 4, marginTop: 8 }}>
                      <div style={{ background: '#22c55e', width: `${Math.min(100,(personBonus[a]/(total25||1))*100)}%`, height: '100%', borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
                {ALL_ASSIGNEES.filter(a => (personBonus[a]??0) > 0).length === 0 && (
                  <div style={{ color: '#aaa', fontSize: 13, gridColumn: '1/-1', textAlign: 'center', padding: '20px 0' }}>本季無已完成案件</div>
                )}
              </div>
            </div>

            {/* 團獎分配 */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>團體獎金配發（3%，季末由組長分配）</div>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>輸入各人獲得的金額，系統自動計算剩餘</div>
              {renderTeamPool('妮組', 妮組Members, 妮池)}
              {renderTeamPool('文組', 文組Members, 文池)}
            </div>

            {/* 案件明細 */}
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>本季案件明細（{eligible.length} 件）</div>
              {eligible.length === 0
                ? <div style={{ color: '#aaa', fontSize: 13, textAlign: 'center', padding: 20 }}>本季無已完成案件</div>
                : (
                  <div className="table-wrap">
                    <table>
                      <thead><tr>
                        <th>案件名稱</th><th>組別</th><th>承辦</th>
                        <th>簽約金額</th><th>個人 2.5%</th><th>組控 1.5%</th><th>團獎 3%</th>
                      </tr></thead>
                      <tbody>
                        {eligible.map(c => (
                          <tr key={c.id}>
                            <td style={{ fontWeight: 500 }}>{c.name}</td>
                            <td><span className={`badge team-${c.team}`}>{c.team}</span></td>
                            <td style={{ fontSize: 12 }}>{c.assignees.join(', ') || '—'}</td>
                            <td style={{ fontSize: 13, fontWeight: 600 }}>{c.contractAmount ? fmt(c.contractAmount) : '—'}</td>
                            <td style={{ fontSize: 13, color: '#15803d' }}>{c.bonus25 ? fmt(c.bonus25) : '—'}</td>
                            <td style={{ fontSize: 13, color: '#1d4ed8' }}>{c.bonus15 ? fmt(c.bonus15) : '—'}</td>
                            <td style={{ fontSize: 13, color: '#d97706', fontWeight: 600 }}>{c.bonus3 ? fmt(c.bonus3) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              }
            </div>
          </>
        )}
      </main>
    </div>
  )
}
