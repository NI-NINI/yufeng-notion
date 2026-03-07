'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import type { Payment_ } from '@/lib/notion'

const 妮組Members = ['慈妮', '紘齊', '韋萱']
const 文組Members = ['文靜', 'Jenny', '旭廷', '方謙']
const ALL_ASSIGNEES = [...妮組Members, ...文組Members]
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']
const YEARS = ['2024', '2025', '2026', '2027']

const PC: Record<string, string> = {
  慈妮: '#B45309', 文靜: '#065F46', 紘齊: '#9F1239', 韋萱: '#4338CA',
  Jenny: '#BE185D', 旭廷: '#92400E', 方謙: '#1E40AF',
}
const uc = (n: string) => PC[n] || '#3F3F46'

export default function BonusPage() {
  const [payments, setPayments] = useState<Payment_[]>([])
  const [loading, setLoading] = useState(true)
  const now = new Date()
  const [year, setYear] = useState(`${now.getFullYear()}`)
  const [quarter, setQuarter] = useState(`Q${Math.ceil((now.getMonth() + 1) / 3)}`)
  // 團體池分配（季末組長輸入）
  const [teamBonus, setTeamBonus] = useState<Record<string, Record<string, number>>>({
    妮組: { 慈妮: 0, 紘齊: 0, 韋萱: 0 },
    文組: { 文靜: 0, Jenny: 0, 旭廷: 0, 方謙: 0 },
  })

  useEffect(() => {
    fetch('/api/payments').then(r => r.json()).then(d => { setPayments(d); setLoading(false) })
  }, [])

  // 本季已實收的付款
  const collected = payments.filter(p =>
    p.status === '已收款' &&
    p.year?.toString() === year &&
    p.quarter === quarter
  )

  // 按案件歸組：計算每案件實收總額（同一案件可能多筆付款）
  const byCase: Record<string, { payments: Payment[], total: number, assignees: string[], team: string }> = {}
  type Payment = Payment_
  collected.forEach(p => {
    if (!byCase[p.caseId]) {
      byCase[p.caseId] = { payments: [], total: 0, assignees: p.caseAssignees ?? [], team: p.caseTeam ?? '' }
    }
    byCase[p.caseId].payments.push(p)
    byCase[p.caseId].total += p.amount ?? 0
  })

  const totalReceived = collected.reduce((s, p) => s + (p.amount ?? 0), 0)
  const total25 = totalReceived * 0.025
  const total15 = totalReceived * 0.015
  const total3 = totalReceived * 0.03

  // 個人獎金（2.5% 按承辦人均分）
  const personBonus: Record<string, number> = {}
  Object.values(byCase).forEach(({ total, assignees }) => {
    if (assignees.length > 0) {
      const share = (total * 0.025) / assignees.length
      assignees.forEach(a => { personBonus[a] = (personBonus[a] ?? 0) + share })
    }
  })

  // 組長控案獎金（1.5%，各組組長收）
  const 妮組Pool = Object.values(byCase).filter(c => c.team === '妮組').reduce((s, c) => s + c.total * 0.015, 0)
  const 文組Pool = Object.values(byCase).filter(c => c.team === '文組').reduce((s, c) => s + c.total * 0.015, 0)

  // 團體池（3%）
  const 妮Pool3 = Object.values(byCase).filter(c => c.team === '妮組').reduce((s, c) => s + c.total * 0.03, 0)
  const 文Pool3 = Object.values(byCase).filter(c => c.team === '文組').reduce((s, c) => s + c.total * 0.03, 0)

  const updateTeamBonus = (group: string, name: string, val: number) =>
    setTeamBonus(prev => ({ ...prev, [group]: { ...prev[group], [name]: val } }))

  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`

  const renderTeamPool = (group: string, members: string[], leader: string, leaderBonus: number, pool3: number) => {
    const allocated = Object.values(teamBonus[group]).reduce((s, v) => s + v, 0)
    const remaining = pool3 - allocated
    return (
      <div style={{ marginBottom: 20 }}>
        {/* 組長控案 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, marginBottom: 12 }}>
          <span style={{ width: 32, height: 32, borderRadius: '50%', background: uc(leader), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{leader[0]}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{leader}（組長控案 1.5%）</div>
            <div style={{ fontSize: 12, color: '#888' }}>本季應得 {fmt(leaderBonus)}</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 22, fontWeight: 700, color: '#15803d' }}>{fmt(leaderBonus)}</div>
        </div>

        {/* 團體池分配 */}
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: group === '妮組' ? '#3b82f6' : '#22c55e', marginRight: 8 }} />
              {group} 團體獎金池 3% = {fmt(pool3)}
            </div>
            <div style={{ fontSize: 12 }}>
              <span style={{ color: '#888' }}>已分配 {Math.round(allocated / (pool3 || 1) * 100)}%</span>
              <span style={{ margin: '0 6px', color: '#ddd' }}>|</span>
              <span style={{ color: remaining < 0 ? '#dc2626' : '#15803d', fontWeight: 600 }}>剩餘 {fmt(remaining)}</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${members.length}, 1fr)`, gap: 10 }}>
            {members.map(name => {
              const val = teamBonus[group][name] ?? 0
              const personal = personBonus[name] ?? 0
              return (
                <div key={name} style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', border: '1px solid #fde68a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: uc(name), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{name[0]}</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{name}</span>
                  </div>
                  <input type="number" min={0} value={val}
                    onChange={e => updateTeamBonus(group, name, Number(e.target.value))}
                    className="input" style={{ width: '100%', padding: '5px 8px', fontSize: 13, marginBottom: 6 }}
                  />
                  <div style={{ fontSize: 11, color: '#555', lineHeight: 1.6 }}>
                    個人 {fmt(personal)}<br />
                    + 團獎 {fmt(val)}<br />
                    <strong>= {fmt(personal + val)}</strong>
                  </div>
                </div>
              )
            })}
          </div>
          {remaining < 0 && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 8 }}>⚠ 已超過獎金池上限 {fmt(Math.abs(remaining))}</div>}
        </div>
      </div>
    )
  }

  // 付款明細：依案件分組顯示
  const caseEntries = Object.entries(byCase).sort((a, b) => b[1].total - a[1].total)

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>獎金配發</h1>
            <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>依「已實收付款」計算，跟著收款進度走</p>
          </div>
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
            {/* 總覽卡片 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: '本季實收總額', val: fmt(totalReceived), sub: `${collected.length} 筆收款`, color: '#1c1c1e' },
                { label: '個人獎金池 2.5%', val: fmt(total25), sub: '承辦人均分', color: '#15803d' },
                { label: '組長控案獎金 1.5%', val: fmt(total15), sub: '組長收', color: '#1d4ed8' },
                { label: '團體獎金池 3%', val: fmt(total3), sub: '季末由組長配發', color: '#d97706' },
              ].map(({ label, val, sub, color }) => (
                <div key={label} className="card">
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color }}>{val}</div>
                  <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>{sub}</div>
                </div>
              ))}
            </div>

            {/* 個人獎金 */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>個人獎金（承辦 2.5%，依實收均分）</div>
              {ALL_ASSIGNEES.filter(a => (personBonus[a] ?? 0) > 0).length === 0
                ? <div style={{ color: '#aaa', fontSize: 13, textAlign: 'center', padding: 20 }}>本季無實收付款</div>
                : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                    {ALL_ASSIGNEES.filter(a => (personBonus[a] ?? 0) > 0).map(a => (
                      <div key={a} style={{ padding: '12px 14px', background: '#f9f8f5', borderRadius: 10, border: '1px solid #ece9e3' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ width: 28, height: 28, borderRadius: '50%', background: uc(a), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{a[0]}</span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{a}</span>
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#15803d' }}>{fmt(personBonus[a])}</div>
                        <div style={{ background: '#e8e6e0', borderRadius: 4, height: 4, marginTop: 8 }}>
                          <div style={{ background: '#22c55e', width: `${Math.min(100, (personBonus[a] / (total25 || 1)) * 100)}%`, height: '100%', borderRadius: 4 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>

            {/* 組長控案 + 團體池分配 */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>組長控案獎金 + 團體獎金池配發</div>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>組長控案為固定收入；團體池由組長季末手動分配</div>
              {renderTeamPool('妮組', 妮組Members, '慈妮', 妮組Pool, 妮Pool3)}
              {renderTeamPool('文組', 文組Members, '文靜', 文組Pool, 文Pool3)}
            </div>

            {/* 收款明細 */}
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>本季收款明細（{collected.length} 筆）</div>
              {caseEntries.length === 0
                ? <div style={{ color: '#aaa', fontSize: 13, textAlign: 'center', padding: 20 }}>本季尚無實收記錄</div>
                : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>案件</th><th>組別</th><th>承辦</th>
                          <th>期別</th><th>實收金額</th>
                          <th>個人 2.5%</th><th>控案 1.5%</th><th>團獎 3%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {caseEntries.map(([caseId, info]) =>
                          info.payments.map((p: Payment, pi: number) => (
                            <tr key={p.id} style={{ background: pi % 2 === 1 ? '#fafaf8' : undefined }}>
                              {pi === 0 && (
                                <td style={{ fontWeight: 500 }} rowSpan={info.payments.length}>{p.caseName || '（未知案件）'}</td>
                              )}
                              {pi === 0 && <td rowSpan={info.payments.length}><span className={`badge team-${info.team}`}>{info.team || '—'}</span></td>}
                              {pi === 0 && <td style={{ fontSize: 12 }} rowSpan={info.payments.length}>{info.assignees.join(', ') || '—'}</td>}
                              <td style={{ fontSize: 12, color: '#888' }}>{p.period || '—'}</td>
                              <td style={{ fontWeight: 600 }}>{fmt(p.amount ?? 0)}</td>
                              <td style={{ color: '#15803d', fontSize: 13 }}>{fmt((p.amount ?? 0) * 0.025)}</td>
                              <td style={{ color: '#1d4ed8', fontSize: 13 }}>{fmt((p.amount ?? 0) * 0.015)}</td>
                              <td style={{ color: '#d97706', fontSize: 13 }}>{fmt((p.amount ?? 0) * 0.03)}</td>
                            </tr>
                          ))
                        )}
                        <tr style={{ fontWeight: 700, background: '#f9f8f5', borderTop: '2px solid #e5e3dc' }}>
                          <td colSpan={4} style={{ textAlign: 'right', fontSize: 13 }}>合計</td>
                          <td>{fmt(totalReceived)}</td>
                          <td style={{ color: '#15803d' }}>{fmt(total25)}</td>
                          <td style={{ color: '#1d4ed8' }}>{fmt(total15)}</td>
                          <td style={{ color: '#d97706' }}>{fmt(total3)}</td>
                        </tr>
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
