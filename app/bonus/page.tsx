'use client'
import { useEffect, useState, useRef } from 'react'
import Sidebar from '@/components/Sidebar'

const TEAMS = ['妮組','文組']
const ALL_MEMBERS: Record<string,{name:string,role:string}[]> = {
  妮組: [{name:'慈妮',role:'leader'},{name:'紘齊',role:'staff'},{name:'韋萱',role:'staff'}],
  文組: [{name:'文靜',role:'leader'},{name:'Jenny',role:'staff'},{name:'旭廷',role:'staff'},{name:'方謙',role:'staff'}],
}
const PC: Record<string,string> = {
  慈妮:'#B45309',文靜:'#065F46',紘齊:'#9F1239',韋萱:'#4338CA',
  Jenny:'#BE185D',旭廷:'#92400E',方謙:'#1E40AF',
}
const uc = (n: string) => PC[n] || '#3F3F46'
const fmt = (n: number) => n.toLocaleString()
const BONUS = { staff: 2.5, leader: 1.5, team: 3.0 }
const QTRS = ['Q1','Q2','Q3','Q4']

export default function BonusPage() {
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [qtr, setQtr] = useState('Q1')
  const [teamShares, setTeamShares] = useState<Record<string,number>>({})
  const chartBarsRef = useRef<HTMLCanvasElement>(null)
  const chartNiRef = useRef<HTMLCanvasElement>(null)
  const chartWenRef = useRef<HTMLCanvasElement>(null)
  const chartTeamsRef = useRef<HTMLCanvasElement>(null)
  const chartsInst = useRef<any[]>([])

  useEffect(() => {
    fetch('/api/cases').then(r => r.json()).then(d => { setCases(d); setLoading(false) })
  }, [])

  const allWithAmt = cases.filter(c => (c.contractAmount||0) > 0)
  const sel = qtr === '全部' ? allWithAmt : allWithAmt.filter(c => c.bonusQuarter === qtr)

  // per-person data
  const personData = TEAMS.flatMap(team => ALL_MEMBERS[team].map(usr => {
    const clr = uc(usr.name)
    const myCases = sel.filter(c => (c.assignees||[]).includes(usr.name))
    let totalAmt = 0, totalStaff = 0, totalLeader = 0
    myCases.forEach((c: any) => {
      totalAmt += c.contractAmount
      totalStaff += Math.round(c.contractAmount * BONUS.staff / 100)
    })
    if (usr.role === 'leader') {
      const allTeamCases = sel.filter((c: any) => c.team === team)
      allTeamCases.forEach((c: any) => {
        totalLeader += Math.round(c.contractAmount * BONUS.leader / 100)
        if (!myCases.find((m: any) => m.id === c.id)) totalAmt += c.contractAmount
      })
    }
    return { name: usr.name, role: usr.role, team, clr, myCases, totalAmt, totalStaff, totalLeader }
  }))

  const gAmt = sel.reduce((s: number, c: any) => s + c.contractAmount, 0)
  const gStaff = Math.round(gAmt * BONUS.staff / 100)
  const gLeader = Math.round(gAmt * BONUS.leader / 100)
  const gTeam = Math.round(gAmt * BONUS.team / 100)

  const getShare = (name: string) => teamShares[name] || 0
  const setShare = (name: string, val: number) => setTeamShares(prev => ({...prev, [name]: val}))

  const getPoolForTeam = (team: string) => {
    const tAmt = sel.filter((c: any) => c.team === team).reduce((s: number, c: any) => s + c.contractAmount, 0)
    return Math.round(tAmt * BONUS.team / 100)
  }
  const getUsedPct = (team: string) => ALL_MEMBERS[team].reduce((s, m) => s + getShare(m.name), 0)

  const getPersonFinal = (name: string, team: string) => {
    const pd = personData.find(p => p.name === name)
    const poolTotal = getPoolForTeam(team)
    const myPool = Math.round(poolTotal * getShare(name) / 100)
    const myLeader = pd?.role === 'leader' ? pd.totalLeader : 0
    return (pd?.totalStaff || 0) + myLeader + myPool
  }

  const qCount: Record<string,number> = {}
  QTRS.forEach(q => qCount[q] = allWithAmt.filter(c => c.bonusQuarter === q).length)
  const unassigned = allWithAmt.filter(c => !c.bonusQuarter).length

  useEffect(() => {
    if (loading || typeof window === 'undefined') return
    // destroy old charts
    chartsInst.current.forEach(ch => { try { ch.destroy() } catch(e){} })
    chartsInst.current = []
    const ChartJS = (window as any).Chart
    if (!ChartJS) return

    // Bar chart
    if (chartBarsRef.current && personData.length) {
      chartsInst.current.push(new ChartJS(chartBarsRef.current, {
        type: 'bar',
        data: {
          labels: personData.map(p => p.name),
          datasets: [
            { label: '承辦個人 2.5%', data: personData.map(p => p.totalStaff), backgroundColor: personData.map(p => p.clr+'CC') },
            { label: '全組控案 1.5%', data: personData.map(p => p.role==='leader'?p.totalLeader:0), backgroundColor: personData.map(p => p.clr+'55') },
          ]
        },
        options: { responsive: true, plugins: { legend: { labels: { font: { size: 11 } } } }, scales: { x: { stacked: true, ticks: { font: { size: 11 } } }, y: { stacked: true, ticks: { font: { size: 10 }, callback: (v: number) => '$'+v.toLocaleString() } } } }
      }))
    }

    // Ni doughnut
    const makePie = (ref: React.RefObject<HTMLCanvasElement|null>, team: string) => {
      if (!ref.current) return
      const poolTotal = getPoolForTeam(team)
      const members = ALL_MEMBERS[team]
      const labels: string[] = [], data: number[] = [], colors: string[] = []
      members.forEach(m => {
        const total = getPersonFinal(m.name, team)
        if (total > 0) { labels.push(m.name); data.push(total); colors.push(uc(m.name)) }
      })
      if (!data.length) return
      chartsInst.current.push(new ChartJS(ref.current, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
        options: { responsive: true, cutout: '55%', plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, boxWidth: 10, padding: 6 } }, tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.label}：$${ctx.parsed.toLocaleString()}` } } } }
      }))
    }
    makePie(chartNiRef, '妮組')
    makePie(chartWenRef, '文組')

    // Combined teams pie
    if (chartTeamsRef.current) {
      const teamTotals = TEAMS.map(team => {
        const members = ALL_MEMBERS[team]
        const total = members.reduce((s, m) => s + getPersonFinal(m.name, team), 0)
        const tAmt = sel.filter((c: any) => c.team === team).reduce((s: number, c: any) => s + c.contractAmount, 0)
        return { team, total, tAmt, color: team==='妮組'?'#B45309':'#065F46' }
      })
      chartsInst.current.push(new ChartJS(chartTeamsRef.current, {
        type: 'doughnut',
        data: { labels: teamTotals.map(t => t.team), datasets: [{ data: teamTotals.map(t => t.total), backgroundColor: teamTotals.map(t => t.color), borderWidth: 3, borderColor: '#fff' }] },
        options: { responsive: true, cutout: '60%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => `${ctx.label}：$${ctx.parsed.toLocaleString()} (${teamTotals.reduce((s,t)=>s+t.total,0)?Math.round(ctx.parsed/teamTotals.reduce((s,t)=>s+t.total,0)*100):0}%)` } } } }
      }))
    }
  }, [sel, teamShares, loading])

  return (
    <div className="app">
      <Sidebar />
      <div className="main-content">
        <div className="page-hd"><h1>獎金試算</h1></div>
        <div className="page-ct">
          {loading ? <div style={{padding:48,textAlign:'center',color:'var(--tx3)'}}>載入中…</div> : (
            <div style={{padding:'16px 24px'}}>
              {/* Q tabs */}
              <div className="qtab-bar">
                {[{k:'全部',cnt:allWithAmt.length},...QTRS.map(q=>({k:q,cnt:qCount[q]||0}))].map(({k,cnt}) => (
                  <div key={k} className={`qtab ${qtr===k?'active':''}`} onClick={()=>setQtr(k)}>
                    {k} <span className="cnt">{cnt}</span>
                  </div>
                ))}
                {unassigned > 0 && <div style={{marginLeft:'auto',padding:'7px 0',fontSize:11,color:'var(--warn)'}}>⚠ {unassigned} 件未指定季度</div>}
              </div>

              {/* 獎金結構說明 */}
              <div style={{fontSize:12,color:'var(--tx2)',marginBottom:12}}>
                獎金結構：承辦 <b>2.5%</b> ＋ 組長 <b>1.5%</b> ＋ 團體池 <b>3.0%</b> ＝ 合計 <b>7.0%</b>
                <span style={{marginLeft:16,color:'var(--tx3)'}}>共 <b style={{color:'var(--tx)'}}>{sel.length}</b> 件 · 總額 <b style={{color:'var(--tx)'}}>$</b><b style={{color:'var(--tx)',fontFamily:'var(--m)'}}>{fmt(gAmt)}</b></span>
              </div>

              {sel.length === 0 ? (
                <div style={{textAlign:'center',padding:48,color:'var(--tx3)'}}>此季度尚無案件<br/><span style={{fontSize:11}}>請在案件詳情中設定「獎金季度」</span></div>
              ) : (<>
                {/* Summary KPI bar */}
                <div className="bonus-summary">
                  {[['簽約總額', fmt(gAmt), false],['承辦個人合計', fmt(gStaff), false],['組長控案合計', fmt(gLeader), false],['團體池合計', fmt(gTeam), true]].map(([l,v,w])=>(
                    <div key={String(l)} className="bonus-kpi">
                      <div className="k">{l}</div>
                      <div className={`v ${w?'warn':''}`}>${v}</div>
                    </div>
                  ))}
                </div>

                {/* Per-team person cards */}
                {TEAMS.map(team => {
                  const tPeople = personData.filter(p => p.team === team)
                  const tAmt = tPeople.reduce((s,p) => s + (sel.filter((c:any)=>c.team===team).reduce((ss:number,c:any)=>ss+c.contractAmount,0)), 0) / tPeople.length
                  const realTAmt = sel.filter((c:any)=>c.team===team).reduce((s:number,c:any)=>s+c.contractAmount,0)
                  return (
                    <div key={team} style={{marginBottom:16}}>
                      <div style={{fontSize:11,fontWeight:600,color:'var(--tx2)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:8,display:'flex',alignItems:'center',gap:10}}>
                        {team}
                        <span style={{fontWeight:400,color:'var(--tx3)'}}>簽約 ${fmt(realTAmt)} · 承辦 ${fmt(tPeople.reduce((s,p)=>s+p.totalStaff,0))}</span>
                      </div>
                      <div className="bonus-person-grid">
                        {tPeople.map(p => (
                          <div key={p.name} className="bpc" style={{borderTop:`3px solid ${p.clr}`}}>
                            <div className="bpc-name">
                              <span className="pn-a" style={{background:p.clr,width:20,height:20,fontSize:10,display:'inline-flex',alignItems:'center',justifyContent:'center',borderRadius:'50%',color:'#fff'}}>{p.name[0]}</span>
                              {p.name} <span style={{fontSize:10,color:'var(--tx3)',fontWeight:400}}>{p.team}</span>
                            </div>
                            <div className="bpc-row"><span>案件數</span><b>{p.myCases.length} 件</b></div>
                            <div className="bpc-row"><span>承辦個人 2.5%</span><b>${fmt(p.totalStaff)}</b></div>
                            {p.role==='leader' && <div className="bpc-row" style={{color:'var(--ok)'}}><span>全組控案 1.5%</span><b style={{color:'var(--ok)'}}>${fmt(p.totalLeader)}</b></div>}
                            <div className="bpc-row" style={{color:'var(--warn)'}}><span>進入團體池</span><b style={{color:'var(--warn)'}}>—</b></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}

                {/* Charts */}
                <div className="bonus-charts" style={{gridTemplateColumns:'1fr 1fr 1fr'}}>
                  <div className="chart-card"><h4>各人固定獎金</h4><canvas ref={chartBarsRef} height={220} /></div>
                  <div className="chart-card"><h4>妮組獎金分配</h4><canvas ref={chartNiRef} height={220} /></div>
                  <div className="chart-card"><h4>文組獎金分配</h4><canvas ref={chartWenRef} height={220} /></div>
                </div>
                <div className="bonus-charts" style={{gridTemplateColumns:'1fr 2fr',marginTop:0}}>
                  <div className="chart-card"><h4>雙組比較</h4><canvas ref={chartTeamsRef} height={240} /></div>
                  <div className="chart-card" style={{display:'flex',flexDirection:'column',justifyContent:'center'}}>
                    <div style={{fontSize:11,color:'var(--tx3)',marginBottom:12,textTransform:'uppercase',letterSpacing:'.5px'}}>各組獎金彙整</div>
                    {TEAMS.map(team => {
                      const tAmt = sel.filter((c:any)=>c.team===team).reduce((s:number,c:any)=>s+c.contractAmount,0)
                      const total = ALL_MEMBERS[team].reduce((s,m)=>s+getPersonFinal(m.name,team),0)
                      const grand = TEAMS.reduce((s,t)=>s+ALL_MEMBERS[t].reduce((ss,m)=>ss+getPersonFinal(m.name,t),0),0)
                      const pct = grand ? Math.round(total/grand*100) : 0
                      const color = team==='妮組'?'#B45309':'#065F46'
                      return <div key={team} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid var(--bdl)'}}>
                        <div style={{width:12,height:12,borderRadius:2,background:color,flexShrink:0}} />
                        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{team}</div><div style={{fontSize:11,color:'var(--tx3)'}}>簽約 ${tAmt.toLocaleString()}</div></div>
                        <div style={{textAlign:'right'}}><div style={{fontSize:16,fontWeight:700,fontFamily:'var(--m)'}}>${total.toLocaleString()}</div><div style={{fontSize:11,color:'var(--tx3)'}}>{pct}%</div></div>
                      </div>
                    })}
                  </div>
                </div>

                {/* Team pool allocation */}
                {TEAMS.map(team => {
                  const poolTotal = getPoolForTeam(team)
                  const members = ALL_MEMBERS[team]
                  const usedPct = getUsedPct(team)
                  const pctOk = usedPct === 100
                  return (
                    <div key={team} className="pool-box">
                      <div className="pool-box-hd">
                        <div className="pool-title">🪙 {team} 團體獎金池 <span style={{fontFamily:'var(--m)'}}>${fmt(poolTotal)}</span></div>
                        <span className="pool-status" style={{color:pctOk?'var(--ok)':'var(--warn)'}}>
                          {pctOk ? '✓ 已分配 100%' : `已分配 ${usedPct}%，剩餘 ${100-usedPct}%`}
                        </span>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:8}}>
                        {members.map(m => {
                          const share = getShare(m.name)
                          const amt = Math.round(poolTotal * share / 100)
                          return <div key={m.name} style={{display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,.6)',borderRadius:'var(--rs)',padding:'7px 10px'}}>
                            <span className="pn"><span className="pn-a" style={{background:uc(m.name)}}>{m.name[0]}</span>{m.name}</span>
                            <div style={{flex:1,display:'flex',alignItems:'center',gap:4,marginLeft:'auto'}}>
                              <input type="number" className="pool-input" min={0} max={100} value={share}
                                onChange={e => setShare(m.name, Math.min(100, Math.max(0, parseFloat(e.target.value)||0)))} />
                              <span style={{fontSize:11,color:'var(--warn)'}}>%</span>
                              <span style={{fontSize:12,fontFamily:'var(--m)',color:'var(--tx)',fontWeight:600,minWidth:70,textAlign:'right'}}>${fmt(amt)}</span>
                            </div>
                          </div>
                        })}
                      </div>
                    </div>
                  )
                })}

                {/* Final summary tables */}
                {TEAMS.map(team => {
                  const poolTotal = getPoolForTeam(team)
                  const members = ALL_MEMBERS[team]
                  return (
                    <div key={team} className="summary-box">
                      <div className="summary-box-hd">
                        <span style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px',color:'var(--tx2)'}}>{team} 獎金分配結果</span>
                        <span style={{fontSize:11,color:'var(--tx3)'}}>（承辦 2.5% + 組長 1.5% + 團體池分配）</span>
                      </div>
                      <table>
                        <thead><tr>
                          <th>成員</th>
                          <th style={{textAlign:'right'}}>承辦 2.5%</th>
                          <th style={{textAlign:'right'}}>控案 1.5%</th>
                          <th style={{textAlign:'right',color:'var(--warn)'}}>團體池分配</th>
                          <th style={{textAlign:'right',fontWeight:700}}>合計</th>
                        </tr></thead>
                        <tbody>
                          {members.map(m => {
                            const pd = personData.find(p => p.name === m.name)
                            const myStaff = pd?.totalStaff || 0
                            const myLeader = m.role === 'leader' ? (pd?.totalLeader || 0) : 0
                            const myPool = Math.round(poolTotal * getShare(m.name) / 100)
                            const total = myStaff + myLeader + myPool
                            return <tr key={m.name}>
                              <td><span className="pn"><span className="pn-a" style={{background:uc(m.name)}}>{m.name[0]}</span>{m.name}</span></td>
                              <td style={{textAlign:'right',fontFamily:'var(--m)',fontSize:12}}>${fmt(myStaff)}</td>
                              <td style={{textAlign:'right',fontFamily:'var(--m)',fontSize:12,color:'var(--ok)'}}>{myLeader>0?'$'+fmt(myLeader):'—'}</td>
                              <td style={{textAlign:'right',fontFamily:'var(--m)',fontSize:12,color:'var(--warn)'}}>${fmt(myPool)}</td>
                              <td style={{textAlign:'right',fontFamily:'var(--m)',fontSize:12,fontWeight:700}}>${fmt(total)}</td>
                            </tr>
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                })}

                {/* Detail table */}
                <table style={{marginTop:8}}>
                  <thead><tr>
                    <th>案件</th><th>組別</th><th>承辦</th><th>季度</th><th>簽約金額</th>
                    <th>承辦 2.5%</th><th>組長 1.5%</th><th style={{color:'var(--warn)'}}>團體池 3.0%</th>
                  </tr></thead>
                  <tbody>
                    {sel.map((c: any) => {
                      const staff = Math.round(c.contractAmount*2.5/100)
                      const leader = Math.round(c.contractAmount*1.5/100)
                      const team = Math.round(c.contractAmount*3/100)
                      return <tr key={c.id}>
                        <td style={{fontWeight:500}}>{c.name}</td>
                        <td><span className="tg tg-o">{c.team}</span></td>
                        <td>{(c.assignees||[]).join(', ')||'—'}</td>
                        <td><span className="tg tg-o" style={{fontFamily:'var(--m)'}}>{c.bonusQuarter||'—'}</span></td>
                        <td style={{fontFamily:'var(--m)',fontSize:12}}>${c.contractAmount.toLocaleString()}</td>
                        <td style={{fontFamily:'var(--m)',fontSize:12}}>${staff.toLocaleString()}</td>
                        <td style={{fontFamily:'var(--m)',fontSize:12}}>${leader.toLocaleString()}</td>
                        <td style={{fontFamily:'var(--m)',fontSize:12,color:'var(--warn)'}}>${team.toLocaleString()}</td>
                      </tr>
                    })}
                    <tr style={{fontWeight:600,background:'var(--bg)'}}>
                      <td colSpan={4}>合計（{sel.length}件）</td>
                      <td style={{fontFamily:'var(--m)'}}>${fmt(gAmt)}</td>
                      <td style={{fontFamily:'var(--m)'}}>${fmt(gStaff)}</td>
                      <td style={{fontFamily:'var(--m)'}}>${fmt(gLeader)}</td>
                      <td style={{fontFamily:'var(--m)',color:'var(--warn)'}}>${fmt(gTeam)}</td>
                    </tr>
                  </tbody>
                </table>
              </>)}
            </div>
          )}
        </div>
      </div>
      
    </div>
  )
}
