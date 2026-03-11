'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import type { Case_ } from '@/lib/notion'

const 妮組Members = ['慈妮','紘齊','韋萱']
const 文組Members = ['文靜','Jenny','旭庭','方謙']
const ALL_ASSIGNEES = [...妮組Members, ...文組Members]
const QUARTERS = ['Q1','Q2','Q3','Q4']
const YEARS = ['2024','2025','2026','2027']

const COLORS = ['#3b82f6','#f59e0b','#ec4899','#8b5cf6','#22c55e','#f97316','#06b6d4']

export default function BonusStatsPage() {
  const [cases, setCases] = useState<Case_[]>([])
  const [loading, setLoading] = useState(true)
  const now = new Date()
  const [year, setYear] = useState(`${now.getFullYear()}`)
  const [quarter, setQuarter] = useState(`Q${Math.ceil((now.getMonth()+1)/3)}`)

  useEffect(() => {
    fetch('/api/cases').then(r => r.json()).then(d => { setCases(d); setLoading(false) })
  }, [])

  const eligible = cases.filter(c =>
    c.year === year && c.quarter === quarter && ['已完成','已請款'].includes(c.status)
  )

  const personBonus: Record<string, number> = {}
  eligible.forEach(c => {
    if (c.assignees.length > 0 && c.bonus25) {
      const share = c.bonus25 / c.assignees.length
      c.assignees.forEach(a => { personBonus[a] = (personBonus[a] ?? 0) + share })
    }
  })
  const personLeader: Record<string, number> = {}
  eligible.forEach(c => {
    if (c.bonus15) {
      const leader = c.team === '妮組' ? '慈妮' : '文靜'
      personLeader[leader] = (personLeader[leader] ?? 0) + (c.bonus15 ?? 0)
    }
  })

  const 妮組Cases = eligible.filter(c => c.team === '妮組')
  const 文組Cases = eligible.filter(c => c.team === '文組')
  const 妮組Pool = 妮組Cases.reduce((s,c)=>s+(c.bonus3??0),0)
  const 文組Pool = 文組Cases.reduce((s,c)=>s+(c.bonus3??0),0)

  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`

  const DonutChart = ({ data, size = 160 }: { data: {label:string,value:number,color:string}[], size?: number }) => {
    const total = data.reduce((s,d) => s+d.value, 0)
    if (total === 0) return <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: 13 }}>無資料</div>
    let cumulative = 0
    const cx = size/2, cy = size/2, r = size*0.38, inner = size*0.22
    const segments = data.filter(d=>d.value>0).map(d => {
      const pct = d.value / total
      const startAngle = cumulative * 2 * Math.PI - Math.PI/2
      cumulative += pct
      const endAngle = cumulative * 2 * Math.PI - Math.PI/2
      const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle)
      const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle)
      const ix1 = cx + inner * Math.cos(startAngle), iy1 = cy + inner * Math.sin(startAngle)
      const ix2 = cx + inner * Math.cos(endAngle), iy2 = cy + inner * Math.sin(endAngle)
      const large = pct > 0.5 ? 1 : 0
      return { ...d, path: `M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} L${ix2},${iy2} A${inner},${inner} 0 ${large},0 ${ix1},${iy1} Z` }
    })
    return (
      <svg width={size} height={size}>
        {segments.map((s,i) => <path key={i} d={s.path} fill={s.color} />)}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="#888">合計</text>
        <text x={cx} y={cy+14} textAnchor="middle" dominantBaseline="middle" fontSize={12} fontWeight={700} fill="#1a1a1a">{fmt(total)}</text>
      </svg>
    )
  }

  const PersonBar = ({ name, personal, leader, color }: {name:string,personal:number,leader:number,color:string}) => {
    const total = personal + leader
    const maxVal = Math.max(...ALL_ASSIGNEES.map(a => (personBonus[a]??0)+(personLeader[a]??0)), 1)
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
          <span style={{ fontWeight: 600 }}>{name}</span>
          <span style={{ color: '#15803d', fontWeight: 700 }}>{fmt(total)}</span>
        </div>
        <div style={{ background: '#f0f0f0', borderRadius: 4, height: 12, overflow: 'hidden', display: 'flex' }}>
          <div style={{ background: color, width: `${(personal/maxVal)*100}%`, height: '100%', transition: 'width 0.3s' }} />
          <div style={{ background: color+'99', width: `${(leader/maxVal)*100}%`, height: '100%', transition: 'width 0.3s' }} />
        </div>
        <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>承辦 {fmt(personal)} + 組控 {fmt(leader)}</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>獎金統計</h1>
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
            {/* 個人固定獎金長條圖 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div className="card">
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>妮組獎金分佈</div>
                {妮組Members.map((a,i) => (
                  <PersonBar key={a} name={a} personal={personBonus[a]??0} leader={personLeader[a]??0} color={COLORS[i]} />
                ))}
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                  <DonutChart size={140} data={妮組Members.map((a,i)=>({ label: a, value: (personBonus[a]??0)+(personLeader[a]??0), color: COLORS[i] }))} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                  {妮組Members.map((a,i) => <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i] }} />{a}</div>)}
                </div>
              </div>

              <div className="card">
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>文組獎金分佈</div>
                {文組Members.map((a,i) => (
                  <PersonBar key={a} name={a} personal={personBonus[a]??0} leader={personLeader[a]??0} color={COLORS[i+3]} />
                ))}
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                  <DonutChart size={140} data={文組Members.map((a,i)=>({ label: a, value: (personBonus[a]??0)+(personLeader[a]??0), color: COLORS[i+3] }))} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                  {文組Members.map((a,i) => <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i+3] }} />{a}</div>)}
                </div>
              </div>
            </div>

            {/* 雙組比較 + 明細 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div className="card">
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>雙組獎金池比較</div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <DonutChart size={160} data={[
                    { label: '妮組', value: 妮組Cases.reduce((s,c)=>s+(c.contractAmount??0),0), color: '#3b82f6' },
                    { label: '文組', value: 文組Cases.reduce((s,c)=>s+(c.contractAmount??0),0), color: '#22c55e' },
                  ]} />
                </div>
                {[
                  { group: '妮組', cases: 妮組Cases, pool: 妮組Pool, color: '#3b82f6' },
                  { group: '文組', cases: 文組Cases, pool: 文組Pool, color: '#22c55e' },
                ].map(({ group, cases: gc, pool, color }) => (
                  <div key={group} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                      <span style={{ fontWeight: 600 }}>{group}</span>
                      <span style={{ fontSize: 12, color: '#888' }}>簽約 {fmt(gc.reduce((s,c)=>s+(c.contractAmount??0),0))} · {gc.length} 件</span>
                    </div>
                    <span style={{ fontWeight: 700, color: '#d97706' }}>團獎池 {fmt(pool)}</span>
                  </div>
                ))}
              </div>

              <div className="card">
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>個人獎金總表</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 90px', gap: 0 }}>
                  <div className="label">姓名</div>
                  <div className="label" style={{ textAlign: 'right' }}>承辦</div>
                  <div className="label" style={{ textAlign: 'right' }}>組控</div>
                  <div className="label" style={{ textAlign: 'right' }}>合計</div>
                  {ALL_ASSIGNEES.map(a => {
                    const p = personBonus[a] ?? 0
                    const l = personLeader[a] ?? 0
                    if (p + l === 0) return null
                    return [
                      <div key={a+'n'} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontWeight: 500, fontSize: 13 }}>{a}</div>,
                      <div key={a+'p'} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', textAlign: 'right', fontSize: 13, color: '#555' }}>{fmt(p)}</div>,
                      <div key={a+'l'} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', textAlign: 'right', fontSize: 13, color: '#1d4ed8' }}>{l > 0 ? fmt(l) : '—'}</div>,
                      <div key={a+'t'} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#15803d' }}>{fmt(p+l)}</div>,
                    ]
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
