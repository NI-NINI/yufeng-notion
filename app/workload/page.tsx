'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'

// ── 莫蘭迪色系 ────────────────────────────────────────────────
// 妮組：玫瑰灰粉、文組：霧霾藍、共用：薰衣草灰
const MORANDI = {
  niBg:     '#C4A29E', // 玫瑰灰粉（妮組 bar）
  niBgMd:   '#B08880', // 略深
  weBg:     '#8FA3B1', // 霧霾藍（文組 bar）
  weBgMd:   '#7591A2',
  warn:     '#C4A882', // 琥珀莫蘭迪（中高負荷）
  danger:   '#B07070', // 緋紅莫蘭迪（超高負荷）
  card:     '#F5F0EC', // 卡片底
  border:   '#DDD5CD', // 邊框
  tx:       '#5A4F47', // 主文字
  tx2:      '#7A6F67', // 次文字
  tx3:      '#A39890', // 三級文字
  track:    '#E8E0D8', // bar 背景軌道
}

const SHORT: Record<string,string> = {
  '黃慈妮':'慈妮','徐文靜':'文靜','張博宇':'博宇',
  '吳韋萱':'韋萱','許紘齊':'紘齊','郭旭庭':'旭庭','黃湞儀':'湞儀','方謙':'方謙'
}
const dn = (n:string) => SHORT[n] || n

const PEOPLE = [
  { full:'黃慈妮', team:'妮組' },
  { full:'吳韋萱', team:'妮組' },
  { full:'許紘齊', team:'妮組' },
  { full:'方謙',   team:'文組' },
  { full:'郭旭庭', team:'文組' },
  { full:'黃湞儀', team:'文組' },
  { full:'徐文靜', team:'文組' },
  { full:'張博宇', team:'文組' },
]

const STATUS_ACTIVE = ['進行中', '等待中', '覆核中']

function BarRow({ label, value, max, color, track, warn=false, danger=false }:
  { label:string; value:number; max:number; color:string; track:string; warn?:boolean; danger?:boolean }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  const barColor = danger ? MORANDI.danger : warn ? MORANDI.warn : color
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
      <div style={{width:40,fontSize:12,fontWeight:600,color:MORANDI.tx2,textAlign:'right',flexShrink:0}}>{label}</div>
      <div style={{flex:1,height:18,background:track,borderRadius:5,overflow:'hidden',position:'relative'}}>
        <div style={{
          position:'absolute',top:0,left:0,height:'100%',
          width:`${pct}%`,background:barColor,borderRadius:5,
          transition:'width .4s ease'
        }}/>
      </div>
      <div style={{
        width:32,fontSize:13,fontWeight:700,textAlign:'right',
        fontFamily:'monospace',flexShrink:0,
        color: danger ? MORANDI.danger : warn ? MORANDI.warn : MORANDI.tx
      }}>{value || '—'}</div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: MORANDI.card,
      border: `1px solid ${MORANDI.border}`,
      borderRadius: 10,
      padding: '16px 18px',
      flex: 1,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '.06em',
        textTransform: 'uppercase', color: MORANDI.tx3, marginBottom: 14
      }}>{title}</div>
      {children}
    </div>
  )
}

function TeamDonut({ label, niCount, weCount, niLoad, weLoad, totalActive }:
  { label:string; niCount:number; weCount:number; niLoad:number; weLoad:number; totalActive:number }) {
  const total = niCount + weCount
  const niPct = total > 0 ? niCount / total : 0.5
  const r = 36, cx = 44, cy = 44
  const circ = 2 * Math.PI * r
  const niDash = circ * niPct
  return (
    <div style={{display:'flex',alignItems:'center',gap:20}}>
      <svg width={88} height={88}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={MORANDI.track} strokeWidth={10}/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={MORANDI.weBg} strokeWidth={10}
          strokeDasharray={`${circ} ${circ}`} strokeDashoffset={0}
          transform={`rotate(-90 ${cx} ${cy})`}/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={MORANDI.niBg} strokeWidth={10}
          strokeDasharray={`${niDash} ${circ}`} strokeDashoffset={0}
          transform={`rotate(-90 ${cx} ${cy})`}/>
        <text x={cx} y={cy-6} textAnchor="middle" fontSize={16} fontWeight={700} fill={MORANDI.tx}>{totalActive}</text>
        <text x={cx} y={cy+10} textAnchor="middle" fontSize={9} fill={MORANDI.tx3}>進行中</text>
      </svg>
      <div>
        <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:6}}>
          <span style={{width:10,height:10,borderRadius:2,background:MORANDI.niBg,display:'inline-block'}}/>
          <span style={{fontSize:12,color:MORANDI.tx2}}>妮組 {niCount} 案 ／ 負荷 {niLoad}</span>
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          <span style={{width:10,height:10,borderRadius:2,background:MORANDI.weBg,display:'inline-block'}}/>
          <span style={{fontSize:12,color:MORANDI.tx2}}>文組 {weCount} 案 ／ 負荷 {weLoad}</span>
        </div>
      </div>
    </div>
  )
}

export default function WorkloadPage() {
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'count'|'load'>('count')

  useEffect(() => {
    fetch('/api/cases').then(r=>r.json()).then(d => {
      setCases(Array.isArray(d) ? d : [])
      setLoading(false)
    })
  }, [])

  const active = cases.filter(c => STATUS_ACTIVE.includes(c.caseStatus) || c.isActive)

  const stats = PEOPLE.map(p => {
    const myCases = active.filter(c => c.assignees?.includes(p.full))
    const loadSum = myCases.reduce((s:number, c:any) => s + (c.difficulty || 0), 0)
    const urgentCount = myCases.filter((c:any) => c.priority === '急件').length
    const overdueCount = myCases.filter((c:any) => {
      if (!c.dueDate) return false
      return new Date(c.dueDate) < new Date()
    }).length
    return { ...p, short: dn(p.full), count: myCases.length, load: loadSum, urgent: urgentCount, overdue: overdueCount, cases: myCases }
  })

  const maxCount = Math.max(...stats.map(s => s.count), 1)
  const maxLoad  = Math.max(...stats.map(s => s.load), 1)

  const niStats = stats.filter(s => s.team === '妮組')
  const weStats = stats.filter(s => s.team === '文組')
  const niActive = niStats.reduce((s,p) => s + p.count, 0)
  const weActive = weStats.reduce((s,p) => s + p.count, 0)
  const niLoad   = niStats.reduce((s,p) => s + p.load, 0)
  const weLoad   = weStats.reduce((s,p) => s + p.load, 0)

  // 急件清單
  const urgentCases = active.filter(c => c.priority === '急件')
    .sort((a,b) => (a.dueDate||'').localeCompare(b.dueDate||''))

  return (
    <div className="app">
      <Sidebar />
      <div className="main" style={{background:'#FAF6F2'}}>
        <div className="page-hd">
          <h1 style={{color: MORANDI.tx}}>負荷分析</h1>
          <div className="page-hd-r">
            <div style={{display:'flex',gap:0,border:`1px solid ${MORANDI.border}`,borderRadius:6,overflow:'hidden'}}>
              {(['count','load'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding:'4px 14px', fontSize:12, fontWeight:600, cursor:'pointer',
                  background: tab===t ? MORANDI.niBg : 'transparent',
                  color: tab===t ? '#fff' : MORANDI.tx2,
                  border: 'none',
                }}>
                  {t === 'count' ? '案件數' : '負荷量'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading"><div className="spin"/><span>載入中…</span></div>
        ) : (
          <div style={{padding:'0 16px 24px',display:'flex',flexDirection:'column',gap:14}}>

            {/* 概覽卡 */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <Card title="整體概況">
                <TeamDonut
                  label="進行中" niCount={niActive} weCount={weActive}
                  niLoad={niLoad} weLoad={weLoad} totalActive={niActive+weActive}
                />
              </Card>
              <Card title="即時警示">
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',background:'rgba(176,112,112,.1)',borderRadius:6,border:`1px solid ${MORANDI.border}`}}>
                    <span style={{fontSize:12,color:MORANDI.tx2}}>⚠️ 急件</span>
                    <span style={{fontSize:20,fontWeight:700,fontFamily:'monospace',color:MORANDI.danger}}>{urgentCases.length}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',background:'rgba(196,168,130,.1)',borderRadius:6,border:`1px solid ${MORANDI.border}`}}>
                    <span style={{fontSize:12,color:MORANDI.tx2}}>🔔 注意!</span>
                    <span style={{fontSize:20,fontWeight:700,fontFamily:'monospace',color:MORANDI.warn}}>
                      {active.filter(c=>c.redFlag).length}
                    </span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',background:MORANDI.track,borderRadius:6,border:`1px solid ${MORANDI.border}`}}>
                    <span style={{fontSize:12,color:MORANDI.tx2}}>📋 進行中案件</span>
                    <span style={{fontSize:20,fontWeight:700,fontFamily:'monospace',color:MORANDI.tx}}>{active.length}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* 主圖表 */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <Card title={tab==='count' ? '妮組 — 進行中案件數' : '妮組 — 負荷量（難度加總）'}>
                {niStats.map(s => (
                  <BarRow key={s.full} label={s.short}
                    value={tab==='count' ? s.count : s.load}
                    max={tab==='count' ? maxCount : maxLoad}
                    color={MORANDI.niBg} track={MORANDI.track}
                    warn={(tab==='count'?s.count:s.load) > 6}
                    danger={(tab==='count'?s.count:s.load) > 10}
                  />
                ))}
                <div style={{marginTop:10,paddingTop:8,borderTop:`1px solid ${MORANDI.border}`,display:'flex',justifyContent:'space-between',fontSize:11,color:MORANDI.tx3}}>
                  <span>組合計：{tab==='count'?niActive:niLoad}</span>
                  <span>平均：{niStats.length > 0 ? ((tab==='count'?niActive:niLoad)/niStats.length).toFixed(1) : 0}</span>
                </div>
              </Card>

              <Card title={tab==='count' ? '文組 — 進行中案件數' : '文組 — 負荷量（難度加總）'}>
                {weStats.map(s => (
                  <BarRow key={s.full} label={s.short}
                    value={tab==='count' ? s.count : s.load}
                    max={tab==='count' ? maxCount : maxLoad}
                    color={MORANDI.weBg} track={MORANDI.track}
                    warn={(tab==='count'?s.count:s.load) > 6}
                    danger={(tab==='count'?s.count:s.load) > 10}
                  />
                ))}
                <div style={{marginTop:10,paddingTop:8,borderTop:`1px solid ${MORANDI.border}`,display:'flex',justifyContent:'space-between',fontSize:11,color:MORANDI.tx3}}>
                  <span>組合計：{tab==='count'?weActive:weLoad}</span>
                  <span>平均：{weStats.length > 0 ? ((tab==='count'?weActive:weLoad)/weStats.length).toFixed(1) : 0}</span>
                </div>
              </Card>
            </div>

            {/* 個人明細 */}
            <Card title="個人進行中案件明細">
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:10}}>
                {stats.filter(s=>s.count>0).map(s => (
                  <div key={s.full} style={{
                    border:`1px solid ${MORANDI.border}`,borderRadius:7,padding:'10px 12px',
                    background:'#fff'
                  }}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                      <div style={{display:'flex',alignItems:'center',gap:7}}>
                        <div style={{
                          width:26,height:26,borderRadius:6,
                          background: s.team==='妮組' ? MORANDI.niBg : MORANDI.weBg,
                          display:'flex',alignItems:'center',justifyContent:'center',
                          fontSize:12,fontWeight:700,color:'#fff'
                        }}>{s.short[0]}</div>
                        <div>
                          <div style={{fontSize:12,fontWeight:700,color:MORANDI.tx}}>{s.short}</div>
                          <div style={{fontSize:10,color:MORANDI.tx3}}>{s.team}</div>
                        </div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:16,fontWeight:700,fontFamily:'monospace',color:MORANDI.tx}}>{s.count}</div>
                        <div style={{fontSize:10,color:MORANDI.tx3}}>負荷 {s.load||'—'}</div>
                      </div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:3}}>
                      {s.cases.slice(0,5).map((c:any) => (
                        <div key={c.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:11,padding:'3px 0',borderBottom:`1px solid ${MORANDI.track}`}}>
                          <span style={{color:MORANDI.tx2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{c.name||c.caseNumber}</span>
                          <div style={{display:'flex',gap:4,flexShrink:0,marginLeft:6}}>
                            {c.priority==='急件' && <span style={{fontSize:9,padding:'1px 4px',borderRadius:3,background:MORANDI.danger,color:'#fff'}}>急</span>}
                            {c.difficulty && <span style={{fontSize:9,padding:'1px 4px',borderRadius:3,background:MORANDI.track,color:MORANDI.tx2}}>D{c.difficulty}</span>}
                          </div>
                        </div>
                      ))}
                      {s.count > 5 && <div style={{fontSize:10,color:MORANDI.tx3,textAlign:'center',marginTop:2}}>…還有 {s.count-5} 案</div>}
                    </div>
                  </div>
                ))}
                {stats.every(s=>s.count===0) && (
                  <div style={{gridColumn:'1/-1',textAlign:'center',color:MORANDI.tx3,padding:20,fontSize:13}}>目前無進行中案件</div>
                )}
              </div>
            </Card>

            {/* 急件清單 */}
            {urgentCases.length > 0 && (
              <Card title={`急件清單（${urgentCases.length}件）`}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead>
                    <tr style={{borderBottom:`1px solid ${MORANDI.border}`}}>
                      {['案件名稱','承辦','預計出件日','難度','進度'].map(h => (
                        <th key={h} style={{padding:'4px 8px',textAlign:'left',fontWeight:600,color:MORANDI.tx3,fontSize:11}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {urgentCases.map((c:any) => {
                      const days = c.dueDate ? Math.ceil((new Date(c.dueDate).getTime()-Date.now())/864e5) : null
                      return (
                        <tr key={c.id} style={{borderBottom:`1px solid ${MORANDI.track}`}}>
                          <td style={{padding:'6px 8px',color:MORANDI.tx,fontWeight:600}}>{c.name||c.caseNumber}</td>
                          <td style={{padding:'6px 8px',color:MORANDI.tx2}}>{(c.assignees||[]).map((a:string) => dn(a)).join('、')}</td>
                          <td style={{padding:'6px 8px',fontFamily:'monospace',
                            color: days!==null && days<0 ? MORANDI.danger : days!==null && days<=3 ? MORANDI.warn : MORANDI.tx2}}>
                            {c.dueDate ? (days!==null && days<0 ? `逾期${Math.abs(days)}天` : days!==null && days<=3 ? `${days}天後` : c.dueDate.slice(5)) : '—'}
                          </td>
                          <td style={{padding:'6px 8px',color:MORANDI.tx2,fontFamily:'monospace'}}>{c.difficulty||'—'}</td>
                          <td style={{padding:'6px 8px',color:MORANDI.tx3,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.progressNote||'—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </Card>
            )}

            <div style={{fontSize:10,color:MORANDI.tx3,textAlign:'center',marginTop:4}}>
              ● 玫瑰灰 妮組 ｜ 霧霾藍 文組 ｜ 琥珀色 &gt;6 ｜ 緋紅色 &gt;10
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
