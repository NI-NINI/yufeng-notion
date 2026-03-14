'use client'
import { useEffect, useState, useMemo } from 'react'
import Sidebar from '@/components/Sidebar'

const STAFF: { name: string; full: string; team: string; role: string; color: string }[] = [
  { name: '黃慈妮', full: '慈妮', team: '妮組', role: 'leader', color: '#B45309' },
  { name: '許紘齊', full: '紘齊', team: '妮組', role: 'staff',  color: '#9F1239' },
  { name: '吳韋萱', full: '韋萱', team: '妮組', role: 'staff',  color: '#4338CA' },
  { name: '徐文靜', full: '文靜', team: '文組', role: 'leader', color: '#065F46' },
  { name: '黃湞儀', full: '湞儀', team: '文組', role: 'staff',  color: '#BE185D' },
  { name: '郭旭庭', full: '旭庭', team: '文組', role: 'staff',  color: '#92400E' },
  { name: '方謙',   full: '方謙', team: '文組', role: 'staff',  color: '#1E40AF' },
  { name: '張博宇', full: '博宇', team: '未派', role: 'staff',  color: '#374151' },
]

const TEAM_COLORS: Record<string, string> = { 妮組: '#ec4899', 文組: '#3b82f6', 舊案: '#9ca3af', 未派: '#6b7280' }
const fd = (d: string) => { if (!d) return '—'; const t = new Date(d); return `${t.getMonth()+1}/${t.getDate()}` }
const dl = (d: string) => d ? Math.ceil((new Date(d).getTime() - Date.now()) / 864e5) : null

// 迷你條形圖
const MiniBar = ({ value, max, color, height = 8 }: any) => (
  <div style={{ width: '100%', height, borderRadius: height/2, background: 'var(--bd)', overflow: 'hidden' }}>
    <div style={{ width: `${Math.min(100, value/max*100)}%`, height: '100%', borderRadius: height/2, background: color, transition: 'width .4s ease' }} />
  </div>
)

// 環形圖（純CSS/SVG）
const DonutChart = ({ data, size = 100 }: { data: { label: string; value: number; color: string }[], size?: number }) => {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--bd)' }} />
  const r = 38, cx = 50, cy = 50, stroke = 14
  let cumPct = 0
  const circumference = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bd)" strokeWidth={stroke} />
      {data.map((d, i) => {
        const pct = d.value / total
        const offset = circumference * (1 - pct)
        const rotation = cumPct * 360 - 90
        cumPct += pct
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={d.color} strokeWidth={stroke}
            strokeDasharray={`${circumference * pct} ${circumference * (1 - pct)}`}
            strokeDashoffset={circumference * 0.25}
            transform={`rotate(${cumPct * 360 - pct * 360 - 90} ${cx} ${cy})`}
            style={{ transition: 'all .4s ease' }}
          />
        )
      })}
      <text x="50" y="46" textAnchor="middle" fontSize="16" fontWeight="700" fill="var(--tx)">{total}</text>
      <text x="50" y="57" textAnchor="middle" fontSize="7" fill="var(--tx3)">負荷值總計</text>
    </svg>
  )
}

export default function WorkloadPage() {
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview'|'team'|'timeline'>('overview')
  const [selTeam, setSelTeam] = useState<string>('all')

  useEffect(() => {
    fetch('/api/cases').then(r => r.json()).then(d => { setCases(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  const active = useMemo(() => cases.filter(c => c.status === '進行中'), [cases])

  // 每個人的負荷
  const staffStats = useMemo(() => STAFF.map(s => {
    const myCases = active.filter(c => (c.assignees || []).includes(s.name))
    const load = myCases.reduce((sum: number, c: any) => sum + (parseFloat(c.difficulty) || 0), 0)
    const completion = myCases.reduce((sum: number, c: any) => sum + (parseFloat(c.completionScore) || 0), 0)
    return { ...s, cases: myCases, load, completion, avgCompletion: myCases.length ? completion / myCases.length : 0 }
  }), [active])

  const maxLoad = Math.max(...staffStats.map(s => s.load), 1)

  // 組別統計
  const teamStats = useMemo(() => ['妮組', '文組'].map(team => {
    const members = staffStats.filter(s => s.team === team)
    const teamCases = active.filter(c => c.team === team)
    const totalLoad = members.reduce((s, m) => s + m.load, 0)
    return { team, members, cases: teamCases, totalLoad }
  }), [staffStats, active])

  // 即將到期案件（14天內）
  const urgent = useMemo(() =>
    active.filter(c => { const d = dl(c.dueDate); return d !== null && d <= 14 })
      .sort((a, b) => (dl(a.dueDate) || 99) - (dl(b.dueDate) || 99))
  , [active])

  const donutData = teamStats.map(t => ({ label: t.team, value: t.totalLoad, color: TEAM_COLORS[t.team] }))

  const filteredStaff = selTeam === 'all' ? staffStats : staffStats.filter(s => s.team === selTeam)

  if (loading) return (
    <div className="app"><Sidebar />
      <div className="main"><div className="loading"><div className="spin" /><span>載入中…</span></div></div>
    </div>
  )

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <div className="page-hd">
          <h1>負荷分析</h1>
          <div className="page-hd-r" style={{ gap: 6 }}>
            {(['overview', 'team', 'timeline'] as const).map(t => (
              <button key={t} className={`btn btn-sm ${activeTab === t ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab(t)}>
                {t === 'overview' ? '總覽' : t === 'team' ? '組別分析' : '到期預警'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '16px 20px', overflowY: 'auto', height: 'calc(100vh - 60px)' }}>

          {/* ── 總覽 ── */}
          {activeTab === 'overview' && (
            <div>
              {/* 頂部統計卡 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: '進行中案件', value: active.length, unit: '案', color: 'var(--blue)' },
                  { label: '14天內到期', value: urgent.length, unit: '案', color: urgent.length > 3 ? 'var(--rose)' : 'var(--tx)' },
                  { label: '妮組負荷', value: teamStats[0].totalLoad, unit: 'pt', color: TEAM_COLORS['妮組'] },
                  { label: '文組負荷', value: teamStats[1].totalLoad, unit: 'pt', color: TEAM_COLORS['文組'] },
                ].map(stat => (
                  <div key={stat.label} style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bgc)', border: '1px solid var(--bd)' }}>
                    <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 4 }}>{stat.label}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--m)', color: stat.color }}>
                      {stat.value}<span style={{ fontSize: 13, fontWeight: 400, marginLeft: 2 }}>{stat.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 主要圖表區 */}
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, marginBottom: 20 }}>
                {/* 環形圖 */}
                <div style={{ padding: 16, borderRadius: 10, background: 'var(--bgc)', border: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx2)', alignSelf: 'flex-start' }}>組別負荷分佈</div>
                  <DonutChart data={donutData} size={120} />
                  <div style={{ width: '100%' }}>
                    {donutData.map(d => (
                      <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 12 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                        <span style={{ color: 'var(--tx2)' }}>{d.label}</span>
                        <span style={{ marginLeft: 'auto', fontFamily: 'var(--m)', fontWeight: 700 }}>{d.value} pt</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 橫條圖：每人負荷 */}
                <div style={{ padding: 16, borderRadius: 10, background: 'var(--bgc)', border: '1px solid var(--bd)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx2)' }}>個人負荷對比</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {['all', '妮組', '文組'].map(t => (
                        <button key={t} onClick={() => setSelTeam(t)}
                          style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid var(--bd)', cursor: 'pointer', fontSize: 11,
                            background: selTeam === t ? 'var(--blue)' : 'var(--bgc)', color: selTeam === t ? '#fff' : 'var(--tx3)' }}>
                          {t === 'all' ? '全部' : t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {filteredStaff.map(s => (
                      <div key={s.name} style={{ display: 'grid', gridTemplateColumns: '52px 1fr 36px', gap: 8, alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: s.color, color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {s.full[0]}
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--tx2)' }}>{s.full}</span>
                        </div>
                        <div>
                          <MiniBar value={s.load} max={maxLoad} color={s.color} height={10} />
                          <div style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 2 }}>
                            {s.cases.length} 案
                            {s.load > 15 && <span style={{ color: 'var(--rose)', marginLeft: 4 }}>⚠ 高負荷</span>}
                          </div>
                        </div>
                        <div style={{ fontFamily: 'var(--m)', fontWeight: 700, fontSize: 13, textAlign: 'right', color: s.load > 15 ? 'var(--rose)' : 'var(--tx)' }}>
                          {s.load}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 人員卡片 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {filteredStaff.filter(s => s.cases.length > 0).map(s => {
                  const lvl = s.load > 15 ? '高負荷' : s.load > 8 ? '中等' : '尚可'
                  const lvlColor = s.load > 15 ? 'var(--rose)' : s.load > 8 ? '#d97706' : '#16a34a'
                  return (
                    <div key={s.name} style={{ borderRadius: 10, border: '1px solid var(--bd)', background: 'var(--bgc)', overflow: 'hidden' }}>
                      {/* 卡片標題 */}
                      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--bd)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: s.color, color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {s.full[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{s.full}</div>
                            <div style={{ fontSize: 10, color: 'var(--tx3)' }}>{s.team}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'var(--m)', fontWeight: 800, fontSize: 18, color: lvlColor }}>{s.load}</div>
                          <div style={{ fontSize: 10, color: lvlColor }}>{lvl}</div>
                        </div>
                      </div>
                      {/* 負荷條 */}
                      <div style={{ padding: '6px 14px' }}>
                        <MiniBar value={s.load} max={maxLoad} color={s.color} height={6} />
                      </div>
                      {/* 案件列表 */}
                      <div style={{ maxHeight: 160, overflowY: 'auto' }}>
                        {s.cases.map((c: any) => {
                          const days = dl(c.dueDate)
                          const isUrgent = days !== null && days <= 7
                          return (
                            <div key={c.id} style={{ padding: '6px 14px', borderTop: '1px solid var(--bd)', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                                <div style={{ fontSize: 10, color: 'var(--tx3)' }}>{c.caseType || '—'}</div>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontSize: 10, color: isUrgent ? 'var(--rose)' : 'var(--tx3)', fontWeight: isUrgent ? 700 : 400 }}>
                                  {days === null ? '—' : days < 0 ? `逾期${Math.abs(days)}天` : days <= 3 ? `${days}天` : fd(c.dueDate)}
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--tx3)' }}>
                                  {'★'.repeat(parseFloat(c.difficulty) || 0)}{'☆'.repeat(5 - (parseFloat(c.difficulty) || 0))}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── 組別分析 ── */}
          {activeTab === 'team' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {teamStats.map(ts => (
                <div key={ts.team} style={{ borderRadius: 10, border: '1px solid var(--bd)', background: 'var(--bgc)', overflow: 'hidden' }}>
                  {/* 組標題 */}
                  <div style={{ padding: '12px 16px', background: TEAM_COLORS[ts.team] + '18', borderBottom: '1px solid var(--bd)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: TEAM_COLORS[ts.team] }}>{ts.team}</div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                      <span style={{ color: 'var(--tx3)' }}>案件 <b style={{ color: 'var(--tx)' }}>{ts.cases.length}</b></span>
                      <span style={{ color: 'var(--tx3)' }}>負荷 <b style={{ color: TEAM_COLORS[ts.team] }}>{ts.totalLoad} pt</b></span>
                    </div>
                  </div>
                  {/* 成員列表 */}
                  <div style={{ padding: 12 }}>
                    {ts.members.map(m => (
                      <div key={m.name} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: m.color, color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{m.full[0]}</div>
                            <span style={{ fontWeight: 600 }}>{m.full}</span>
                            <span style={{ fontSize: 10, color: 'var(--tx3)' }}>{m.cases.length} 案</span>
                          </div>
                          <span style={{ fontFamily: 'var(--m)', fontWeight: 700, fontSize: 14, color: m.load > 15 ? 'var(--rose)' : 'var(--tx)' }}>{m.load} pt</span>
                        </div>
                        <MiniBar value={m.load} max={Math.max(...ts.members.map(x => x.load), 1)} color={m.color} height={8} />
                        {/* 案件小標签 */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 5 }}>
                          {m.cases.map((c: any) => {
                            const days = dl(c.dueDate)
                            return (
                              <span key={c.id} style={{
                                fontSize: 10, padding: '1px 6px', borderRadius: 3,
                                background: days !== null && days <= 7 ? '#fef2f2' : 'var(--bgh)',
                                color: days !== null && days <= 7 ? 'var(--rose)' : 'var(--tx2)',
                                border: `1px solid ${days !== null && days <= 7 ? '#fecaca' : 'var(--bd)'}`,
                                maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}>{c.name}</span>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── 到期預警 ── */}
          {activeTab === 'timeline' && (
            <div>
              <div style={{ marginBottom: 12, fontSize: 12, color: 'var(--tx3)' }}>
                顯示進行中且 14 天內到期的案件，共 <b style={{ color: 'var(--tx)' }}>{urgent.length}</b> 件
              </div>
              {urgent.length === 0 ? (
                <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--tx3)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
                  <div>近 14 天內無即將到期案件</div>
                </div>
              ) : (
                <>
                  {/* 表頭 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 70px 80px 80px', gap: 8, padding: '6px 12px', borderBottom: '2px solid var(--bd)', marginBottom: 4 }}>
                    {['案件名稱', '委託單位', '截止日', '距今', '承辦'].map(h => (
                      <span key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase' }}>{h}</span>
                    ))}
                  </div>
                  {urgent.map((c: any) => {
                    const days = dl(c.dueDate)!
                    const urgColor = days < 0 ? '#dc2626' : days <= 3 ? 'var(--rose)' : days <= 7 ? '#d97706' : 'var(--tx2)'
                    return (
                      <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 70px 80px 80px', gap: 8, padding: '9px 12px', borderBottom: '1px solid var(--bd)', background: days < 0 ? '#fef2f2' : days <= 3 ? '#fff7ed' : 'var(--bgc)', borderRadius: 6, marginBottom: 2 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--tx3)' }}>{c.caseType}</div>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--tx2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.clientName || '—'}</div>
                        <div style={{ fontSize: 12, fontFamily: 'var(--m)', color: urgColor, fontWeight: 700 }}>{fd(c.dueDate)}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: urgColor }}>
                          {days < 0 ? `逾期 ${Math.abs(days)} 天` : `${days} 天`}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                          {(c.assignees || []).slice(0, 2).map((a: string) => {
                            const st = STAFF.find(s => s.name === a)
                            return <span key={a} style={{ width: 18, height: 18, borderRadius: '50%', background: st?.color || '#999', color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{(st?.full || a)[0]}</span>
                          })}
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
