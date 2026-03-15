'use client'
import { useEffect, useState, useMemo } from 'react'
import Sidebar from '@/components/Sidebar'

const STAFF = [
  { name: '黃慈妮', short: '慈妮', team: '妮組', color: '#9B59B6' },
  { name: '許紘齊', short: '紘齊', team: '妮組', color: '#E74C3C' },
  { name: '吳韋萱', short: '韋萱', team: '妮組', color: '#3498DB' },
  { name: '徐文靜', short: '文靜', team: '文組', color: '#27AE60' },
  { name: '黃湞儀', short: '湞儀', team: '文組', color: '#E67E22' },
  { name: '郭旭庭', short: '旭庭', team: '文組', color: '#16A085' },
  { name: '方謙',   short: '方謙', team: '文組', color: '#2C3E50' },
]
const TC: Record<string, string> = { 妮組: '#E67E73', 文組: '#6BA3D6' }
const TL: Record<string, string> = { 妮組: '#FDF2F1', 文組: '#EEF3FB' }
const fmtFee = (n: number) => n === 0 ? '—' : n >= 10000 ? `$${(n/10000).toFixed(1)}萬` : `$${n.toLocaleString()}`

// 環形 SVG
function Ring({ ni, wen, label, total }: { ni: number; wen: number; label: string; total: string }) {
  const sum = ni + wen
  if (sum === 0) return (
    <div style={{ width: 110, height: 110, borderRadius: '50%', background: 'rgba(55,53,47,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 11, color: '#AAAAA0' }}>無資料</span>
    </div>
  )
  const r = 40, cx = 55, cy = 55, sw = 11, circ = 2 * Math.PI * r
  const wenPct = wen / sum
  const niPct = ni / sum
  const wenArc = circ * wenPct
  const niArc  = circ * niPct
  return (
    <div style={{ position: 'relative', width: 110, height: 110 }}>
      <svg width={110} height={110} viewBox="0 0 110 110">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(55,53,47,.07)" strokeWidth={sw} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={TC['文組']} strokeWidth={sw}
          strokeDasharray={`${wenArc} ${circ - wenArc}`}
          strokeDashoffset={circ * 0.25}
          style={{ transition: 'all .5s ease' }} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={TC['妮組']} strokeWidth={sw}
          strokeDasharray={`${niArc} ${circ - niArc}`}
          strokeDashoffset={circ * 0.25 - wenArc}
          style={{ transition: 'all .5s ease' }} />
        <text x="55" y="51" textAnchor="middle" fontSize="15" fontWeight="700" fill="#37352F">{total}</text>
        <text x="55" y="63" textAnchor="middle" fontSize="8" fill="#AAAAA0">{label}</text>
      </svg>
    </div>
  )
}

// 橫向長條圖 — 單行，帶 tooltip hover
function Bar({ short, val, maxVal, color, tooltip }: { short: string; val: number; maxVal: number; color: string; tooltip: string }) {
  const [hov, setHov] = useState(false)
  const pct = maxVal > 0 ? val / maxVal * 100 : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, position: 'relative' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ width: 26, height: 26, borderRadius: '50%', background: color, color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {short[0]}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 11 }}>
          <span style={{ color: '#787774', fontWeight: 500 }}>{short}</span>
          <span style={{ fontFamily: 'var(--m)', fontWeight: 600, color: val > 0 ? '#37352F' : '#AAAAA0' }}>{val > 0 ? val : '—'}</span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: 'rgba(55,53,47,.06)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 3, background: color, width: `${pct}%`, transition: 'width .5s ease', opacity: hov ? 1 : 0.75 }} />
        </div>
      </div>
      {hov && tooltip && (
        <div style={{
          position: 'absolute', left: 36, bottom: '100%', marginBottom: 4,
          background: '#37352F', color: '#fff', fontSize: 10, borderRadius: 5,
          padding: '5px 9px', whiteSpace: 'pre', lineHeight: 1.6, zIndex: 20,
          boxShadow: '0 4px 14px rgba(55,53,47,.18)',
        }}>
          {tooltip}
        </div>
      )}
    </div>
  )
}

function BarFee({ short, val, maxVal, color, tooltip }: { short: string; val: number; maxVal: number; color: string; tooltip: string }) {
  const [hov, setHov] = useState(false)
  const pct = maxVal > 0 ? val / maxVal * 100 : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, position: 'relative' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ width: 26, height: 26, borderRadius: '50%', background: color, color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {short[0]}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 11 }}>
          <span style={{ color: '#787774', fontWeight: 500 }}>{short}</span>
          <span style={{ fontFamily: 'var(--m)', fontWeight: 600, color: val > 0 ? '#37352F' : '#AAAAA0' }}>{fmtFee(val)}</span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: 'rgba(55,53,47,.06)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 3, background: color, width: `${pct}%`, transition: 'width .5s ease', opacity: hov ? 1 : 0.75 }} />
        </div>
      </div>
      {hov && tooltip && (
        <div style={{
          position: 'absolute', left: 36, bottom: '100%', marginBottom: 4,
          background: '#37352F', color: '#fff', fontSize: 10, borderRadius: 5,
          padding: '5px 9px', whiteSpace: 'pre', lineHeight: 1.6, zIndex: 20,
          boxShadow: '0 4px 14px rgba(55,53,47,.18)',
        }}>
          {tooltip}
        </div>
      )}
    </div>
  )
}

// 一個分析區塊：左側環形 + 右側長條圖
function Section({
  title, niVal, wenVal, ringLabel, ringTotal, barData, isFee,
}: {
  title: string; niVal: number; wenVal: number; ringLabel: string; ringTotal: string;
  barData: { short: string; val: number; color: string; tooltip: string; team: string }[];
  isFee?: boolean;
}) {
  const maxVal = Math.max(...barData.map(d => d.val), 1)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 0, border: '1px solid rgba(55,53,47,.09)', borderRadius: 8, overflow: 'hidden', marginBottom: 12, background: '#fff' }}>
      {/* 左：環形圖 */}
      <div style={{ padding: '20px 24px', borderRight: '1px solid rgba(55,53,47,.09)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#FAFAF9' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#787774', letterSpacing: '.03em', textAlign: 'center' }}>{title}</div>
        <Ring ni={niVal} wen={wenVal} label={ringLabel} total={ringTotal} />
        <div style={{ display: 'flex', gap: 14, fontSize: 11 }}>
          {[['妮組', niVal], ['文組', wenVal]].map(([t, v]) => (
            <div key={t as string} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: TC[t as string] }} />
              <span style={{ color: '#787774' }}>{t}</span>
              <span style={{ fontFamily: 'var(--m)', fontWeight: 700, color: '#37352F', marginLeft: 2 }}>
                {isFee ? fmtFee(v as number) : v}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* 右：長條圖 */}
      <div style={{ padding: '20px 28px 20px 24px' }}>
        {barData.map(d => isFee
          ? <BarFee key={d.short} {...d} maxVal={maxVal} />
          : <Bar key={d.short} {...d} maxVal={maxVal} />
        )}
      </div>
    </div>
  )
}

export default function WorkloadPage() {
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cases').then(r => r.json()).then(d => {
      setCases(Array.isArray(d) ? d : [])
      setLoading(false)
    })
  }, [])

  const staffStats = useMemo(() => STAFF.map(s => {
    const myCases   = cases.filter(c => (c.assignees || []).includes(s.name))
    const myActive  = myCases.filter(c => c.status === '進行中')
    const load      = myActive.reduce((n: number, c: any) => n + (parseFloat(c.difficulty) || 0), 0)
    const fee       = myCases.reduce((n: number, c: any) => n + (parseFloat(c.contractAmount) || 0), 0)
    const activeNames = myActive.slice(0, 5).map((c: any) => c.name || '—').join('\n')
    const loadTip   = `${s.short} 負荷值 ${load} pt\n進行中 ${myActive.length} 件${myActive.length > 0 ? '\n' + activeNames : ''}`
    const caseTip   = `${s.short} 進行中 ${myActive.length} 件\n${activeNames}`
    const feeTip    = `${s.short} 案件金額 ${fmtFee(fee)}\n共 ${myCases.length} 件`
    return { ...s, load, activeCount: myActive.length, fee, loadTip, caseTip, feeTip }
  }), [cases])

  const ni  = staffStats.filter(s => s.team === '妮組')
  const wen = staffStats.filter(s => s.team === '文組')

  const niLoad   = ni.reduce((n, s) => n + s.load, 0)
  const wenLoad  = wen.reduce((n, s) => n + s.load, 0)
  const niCases  = ni.reduce((n, s) => n + s.activeCount, 0)
  const wenCases = wen.reduce((n, s) => n + s.activeCount, 0)
  const niFee    = ni.reduce((n, s) => n + s.fee, 0)
  const wenFee   = wen.reduce((n, s) => n + s.fee, 0)

  if (loading) return (
    <div className="app"><Sidebar /><div className="main"><div className="loading"><div className="spin" /><span>載入中…</span></div></div></div>
  )

  return (
    <div className="app">
      <Sidebar />
      <div className="main" style={{ background: '#fff', color: '#37352F' }}>
        <div className="page-hd">
          <h1>負荷分析</h1>
        </div>
        <div style={{ padding: '20px 28px', overflowY: 'auto', height: 'calc(100vh - 48px)' }}>

          <Section
            title="負荷值（難度加總）"
            niVal={niLoad} wenVal={wenLoad}
            ringLabel="負荷值" ringTotal={String(niLoad + wenLoad)}
            barData={staffStats.map(s => ({ short: s.short, val: s.load, color: s.color, tooltip: s.loadTip, team: s.team }))}
          />

          <Section
            title="進行中案件數"
            niVal={niCases} wenVal={wenCases}
            ringLabel="進行中" ringTotal={String(niCases + wenCases)}
            barData={staffStats.map(s => ({ short: s.short, val: s.activeCount, color: s.color, tooltip: s.caseTip, team: s.team }))}
          />

          <Section
            title="案件服務費用合計"
            niVal={niFee} wenVal={wenFee}
            ringLabel="總金額" ringTotal={fmtFee(niFee + wenFee)}
            barData={staffStats.map(s => ({ short: s.short, val: s.fee, color: s.color, tooltip: s.feeTip, team: s.team }))}
            isFee
          />

          <div style={{ fontSize: 11, color: '#AAAAA0', textAlign: 'center', paddingBottom: 24 }}>
            負荷值 = 進行中案件難度加總 ／ 服務費用 = 所有案件已填金額合計
          </div>
        </div>
      </div>
    </div>
  )
}
