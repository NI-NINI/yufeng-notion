'use client'
import { useEffect, useState, useMemo } from 'react'
import Sidebar from '@/components/Sidebar'

const STAFF = [
  { name: '黃慈妮', short: '慈妮', team: '妮組', color: '#B45309' },
  { name: '許紘齊', short: '紘齊', team: '妮組', color: '#9F1239' },
  { name: '吳韋萱', short: '韋萱', team: '妮組', color: '#4338CA' },
  { name: '徐文靜', short: '文靜', team: '文組', color: '#065F46' },
  { name: '黃湞儀', short: '湞儀', team: '文組', color: '#BE185D' },
  { name: '郭旭庭', short: '旭庭', team: '文組', color: '#92400E' },
  { name: '方謙',   short: '方謙', team: '文組', color: '#1E40AF' },
]
const TEAM_COLOR: Record<string, string> = { 妮組: '#ec4899', 文組: '#3b82f6' }
const fmt = (n: number) => n >= 10000 ? `${(n/10000).toFixed(1)}萬` : n.toLocaleString()

// 純 SVG 環形圖
function DonutChart({ ni, wen, size = 130 }: { ni: number; wen: number; size?: number }) {
  const total = ni + wen
  if (total === 0) return <div style={{ width: size, height: size }} />
  const r = 44, cx = 60, cy = 60, sw = 13, circ = 2 * Math.PI * r
  const niArc = circ * (ni / total)
  const wenArc = circ * (wen / total)
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bgh)" strokeWidth={sw} />
      {/* 文組 */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={TEAM_COLOR['文組']} strokeWidth={sw}
        strokeDasharray={`${wenArc} ${circ - wenArc}`}
        strokeDashoffset={circ * 0.25}
        transform={`rotate(0 ${cx} ${cy})`} />
      {/* 妮組 */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={TEAM_COLOR['妮組']} strokeWidth={sw}
        strokeDasharray={`${niArc} ${circ - niArc}`}
        strokeDashoffset={circ * 0.25 - wenArc}
        transform={`rotate(0 ${cx} ${cy})`} />
      <text x="60" y="55" textAnchor="middle" fontSize="18" fontWeight="800" fill="var(--tx)">{total}</text>
      <text x="60" y="68" textAnchor="middle" fontSize="8" fill="var(--tx3)">負荷值總計</text>
    </svg>
  )
}

function DonutChartCases({ ni, wen, size = 130 }: { ni: number; wen: number; size?: number }) {
  const total = ni + wen
  if (total === 0) return <div style={{ width: size, height: size }} />
  const r = 44, cx = 60, cy = 60, sw = 13, circ = 2 * Math.PI * r
  const niArc = circ * (ni / total)
  const wenArc = circ * (wen / total)
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bgh)" strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={TEAM_COLOR['文組']} strokeWidth={sw}
        strokeDasharray={`${wenArc} ${circ - wenArc}`}
        strokeDashoffset={circ * 0.25} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={TEAM_COLOR['妮組']} strokeWidth={sw}
        strokeDasharray={`${niArc} ${circ - niArc}`}
        strokeDashoffset={circ * 0.25 - wenArc} />
      <text x="60" y="55" textAnchor="middle" fontSize="18" fontWeight="800" fill="var(--tx)">{total}</text>
      <text x="60" y="68" textAnchor="middle" fontSize="8" fill="var(--tx3)">進行中案件</text>
    </svg>
  )
}

function DonutChartFee({ ni, wen, size = 130 }: { ni: number; wen: number; size?: number }) {
  const total = ni + wen
  if (total === 0) return (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 10, color: 'var(--tx3)' }}>無費用資料</span>
    </div>
  )
  const r = 44, cx = 60, cy = 60, sw = 13, circ = 2 * Math.PI * r
  const niArc = circ * (ni / total)
  const wenArc = circ * (wen / total)
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bgh)" strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={TEAM_COLOR['文組']} strokeWidth={sw}
        strokeDasharray={`${wenArc} ${circ - wenArc}`}
        strokeDashoffset={circ * 0.25} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={TEAM_COLOR['妮組']} strokeWidth={sw}
        strokeDasharray={`${niArc} ${circ - niArc}`}
        strokeDashoffset={circ * 0.25 - wenArc} />
      <text x="60" y="53" textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--tx)">{fmt(total)}</text>
      <text x="60" y="66" textAnchor="middle" fontSize="8" fill="var(--tx3)">案件總金額</text>
    </svg>
  )
}

// 橫向長條圖
function BarChart({ data, maxVal, label }: { data: {name:string; short:string; val:number; color:string}[]; maxVal: number; label: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx2)', marginBottom: 10, textAlign: 'center' }}>{label}</div>
      {data.map(d => (
        <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: d.color, color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {d.short[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
              <span style={{ color: 'var(--tx2)' }}>{d.short}</span>
              <span style={{ fontFamily: 'var(--m)', fontWeight: 700, color: d.val > 0 ? 'var(--tx)' : 'var(--tx3)' }}>{d.val}</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'var(--bgh)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 3, background: d.color, width: `${maxVal > 0 ? d.val / maxVal * 100 : 0}%`, transition: 'width .4s ease' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function BarChartFee({ data, label }: { data: {name:string; short:string; val:number; color:string}[]; label: string }) {
  const maxVal = Math.max(...data.map(d => d.val), 1)
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx2)', marginBottom: 10, textAlign: 'center' }}>{label}</div>
      {data.map(d => (
        <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: d.color, color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {d.short[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
              <span style={{ color: 'var(--tx2)' }}>{d.short}</span>
              <span style={{ fontFamily: 'var(--m)', fontWeight: 700, color: d.val > 0 ? 'var(--tx)' : 'var(--tx3)' }}>{d.val > 0 ? '$' + fmt(d.val) : '—'}</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'var(--bgh)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 3, background: d.color, width: `${d.val / maxVal * 100}%`, transition: 'width .4s ease' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// 圖例
const Legend = () => (
  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8 }}>
    {Object.entries(TEAM_COLOR).map(([t, c]) => (
      <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--tx2)' }}>
        <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
        {t}
      </div>
    ))}
  </div>
)

const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ background: 'var(--bg)', border: '1px solid var(--bd)', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.04em', alignSelf: 'flex-start' }}>{title}</div>
    {children}
  </div>
)

export default function WorkloadPage() {
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cases').then(r => r.json()).then(d => { setCases(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  const active = useMemo(() => cases.filter(c => c.status === '進行中'), [cases])

  const staffStats = useMemo(() => STAFF.map(s => {
    const myCases = cases.filter(c => (c.assignees || []).includes(s.name))
    const myActive = myCases.filter(c => c.status === '進行中')
    const load = myActive.reduce((sum: number, c: any) => sum + (parseFloat(c.difficulty) || 0), 0)
    const fee = myCases.reduce((sum: number, c: any) => sum + (parseFloat(c.contractAmount) || 0), 0)
    return { ...s, load, activeCount: myActive.length, fee }
  }), [cases])

  const niStats  = staffStats.filter(s => s.team === '妮組')
  const wenStats = staffStats.filter(s => s.team === '文組')

  const niLoad  = niStats.reduce((s, x) => s + x.load, 0)
  const wenLoad = wenStats.reduce((s, x) => s + x.load, 0)
  const niCases = niStats.reduce((s, x) => s + x.activeCount, 0)
  const wenCases = wenStats.reduce((s, x) => s + x.activeCount, 0)
  const niFee   = niStats.reduce((s, x) => s + x.fee, 0)
  const wenFee  = wenStats.reduce((s, x) => s + x.fee, 0)

  const maxLoad   = Math.max(...staffStats.map(s => s.load), 1)
  const maxCases  = Math.max(...staffStats.map(s => s.activeCount), 1)

  const loadData  = staffStats.map(s => ({ ...s, val: s.load }))
  const casesData = staffStats.map(s => ({ ...s, val: s.activeCount }))
  const feeData   = staffStats.map(s => ({ ...s, val: s.fee }))

  if (loading) return (
    <div className="app"><Sidebar />
      <div className="main"><div className="loading"><div className="spin" /><span>載入中…</span></div></div>
    </div>
  )

  const ROW_STYLE = { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 12 }
  const PANEL_H = 220

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <div className="page-hd"><h1>負荷分析</h1></div>
        <div style={{ padding: '16px 20px', overflowY: 'auto', height: 'calc(100vh - 48px)' }}>

          {/* ── 行1：負荷值 ── */}
          <div style={ROW_STYLE}>
            <Panel title="組別負荷分佈（難度加總）">
              <DonutChart ni={niLoad} wen={wenLoad} size={120} />
              <Legend />
              <div style={{ display: 'flex', gap: 16, fontSize: 11, marginTop: 4 }}>
                <span><span style={{ color: TEAM_COLOR['妮組'] }}>●</span> 妮組 <b>{niLoad}</b> pt</span>
                <span><span style={{ color: TEAM_COLOR['文組'] }}>●</span> 文組 <b>{wenLoad}</b> pt</span>
              </div>
            </Panel>
            <Panel title="個人負荷量（進行中案件難度加總）">
              <BarChart data={loadData} maxVal={maxLoad} label="" />
            </Panel>
          </div>

          {/* ── 行2：案件數 ── */}
          <div style={ROW_STYLE}>
            <Panel title="組別進行中案件數">
              <DonutChartCases ni={niCases} wen={wenCases} size={120} />
              <Legend />
              <div style={{ display: 'flex', gap: 16, fontSize: 11, marginTop: 4 }}>
                <span><span style={{ color: TEAM_COLOR['妮組'] }}>●</span> 妮組 <b>{niCases}</b> 件</span>
                <span><span style={{ color: TEAM_COLOR['文組'] }}>●</span> 文組 <b>{wenCases}</b> 件</span>
              </div>
            </Panel>
            <Panel title="個人進行中案件數">
              <BarChart data={casesData} maxVal={maxCases} label="" />
            </Panel>
          </div>

          {/* ── 行3：金額 ── */}
          <div style={ROW_STYLE}>
            <Panel title="組別案件總金額">
              <DonutChartFee ni={niFee} wen={wenFee} size={120} />
              <Legend />
              <div style={{ display: 'flex', gap: 16, fontSize: 11, marginTop: 4 }}>
                <span><span style={{ color: TEAM_COLOR['妮組'] }}>●</span> 妮組 <b>${fmt(niFee)}</b></span>
                <span><span style={{ color: TEAM_COLOR['文組'] }}>●</span> 文組 <b>${fmt(wenFee)}</b></span>
              </div>
            </Panel>
            <Panel title="個人案件總金額（已填服務費用）">
              <BarChartFee data={feeData} label="" />
            </Panel>
          </div>

          <div style={{ fontSize: 11, color: 'var(--tx3)', textAlign: 'center', paddingBottom: 20 }}>
            ＊ 負荷值 = 進行中案件難度加總 ／ 案件金額 = 所有狀態含已填服務費用
          </div>
        </div>
      </div>
    </div>
  )
}
