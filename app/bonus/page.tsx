'use client'
import { useEffect, useState, useRef } from 'react'
import Sidebar from '@/components/Sidebar'

const MEMBERS: Record<string,'妮組'|'文組'> = {
  慈妮:'妮組', 紘齊:'妮組', 韋萱:'妮組',
  文靜:'文組', Jenny:'文組', 旭庭:'文組', 方謙:'文組',
}
const LEADERS: Record<string,string> = { 妮組:'慈妮', 文組:'文靜' }
const POOL_TOTAL = 3 // 3%

interface Payment { id:string; caseId:string; caseName:string; caseTeam:string; caseAssignees:string[]; caseContractAmount:number|null; period:string; amount:number|null; status:string; paymentType?:string; leadingType?:string }
interface Case_ { id:string; name:string; team:string; assignees:string[]; contractAmount:number|null; leadingType?:string }

const fmt = (n:number) => '$'+Math.round(n).toLocaleString()
const PC: Record<string,string> = { 慈妮:'#B45309',文靜:'#065F46',紘齊:'#9F1239',韋萱:'#4338CA',Jenny:'#BE185D',旭庭:'#92400E',方謙:'#1E40AF' }

export default function BonusPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [cases, setCases] = useState<Case_[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'summary'|'personal'|'team'>('summary')
  const [year, setYear] = useState(new Date().getFullYear())
  const [quarter, setQuarter] = useState<'Q1'|'Q2'|'Q3'|'Q4'>('Q1')
  // pool allocation per team
  const [niAlloc, setNiAlloc] = useState<Record<string,number>>({慈妮:40,紘齊:35,韋萱:25})
  const [wenAlloc, setWenAlloc] = useState<Record<string,number>>({文靜:25,Jenny:25,旭庭:25,方謙:25})
  const [niConfirmed, setNiConfirmed] = useState(false)
  const [wenConfirmed, setWenConfirmed] = useState(false)
  const chartsRef = useRef<Record<string,any>>({})

  useEffect(() => {
    (async () => {
      setLoading(true)
      const [pr, cr] = await Promise.all([
        fetch('/api/payments').then(r=>r.json()),
        fetch('/api/cases').then(r=>r.json()),
      ])
      setPayments(Array.isArray(pr)?pr:[])
      setCases(Array.isArray(cr)?cr:[])
      setLoading(false)
    })()
  }, [])

  // 過濾已收款（非領銜費）
  const received = payments.filter(p =>
    p.status === '已收款' &&
    (p as any).paymentType !== '領銜費' &&
    (!p.caseTeam || true) // all teams
  )

  // 依案件計算獎金
  const leadingPayments = payments.filter(p => (p as any).paymentType === '領銜費' && p.status === '已收款')

  // 計算個人獎金
  const personalBonus: Record<string, {work:number, control:number, total:number, poolBase:number}> = {}
  const teamPoolBase: Record<string,'妮組'|'文組'> = {}
  let totalReceived = 0
  let niPool = 0, wenPool = 0, nonLeadPool = 0

  received.forEach(p => {
    const amt = p.amount || 0
    const assignees = p.caseAssignees || []
    const team = p.caseTeam
    if (!assignees.length) return
    totalReceived += amt

    // 非領銜 30% 三成池
    const caseObj = cases.find(c=>c.id===p.caseId)
    const isNonLead = caseObj?.leadingType === '非領銜'
    const base = isNonLead ? amt * 0.7 : amt

    // 個人作業 2.5%
    const perPerson = base * 0.025 / assignees.length
    assignees.forEach((a:string) => {
      if (!personalBonus[a]) personalBonus[a] = {work:0,control:0,total:0,poolBase:0}
      personalBonus[a].work += perPerson
    })

    // 組長控案 1.5%
    const leader = LEADERS[team]
    if (leader) {
      if (!personalBonus[leader]) personalBonus[leader] = {work:0,control:0,total:0,poolBase:0}
      personalBonus[leader].control += base * 0.015
    }

    // 3% 團體池
    if (team === '妮組') niPool += base * 0.03
    else if (team === '文組') wenPool += base * 0.03

    if (isNonLead) nonLeadPool += amt * 0.3
  })

  Object.keys(personalBonus).forEach(k => {
    personalBonus[k].total = personalBonus[k].work + personalBonus[k].control
  })

  // 圖表
  const drawCharts = () => {
    if (typeof window === 'undefined' || !(window as any).Chart) return
    const Chart = (window as any).Chart

    const niMembers = ['慈妮','紘齊','韋萱']
    const wenMembers = ['文靜','Jenny','旭庭','方謙']
    const mColors = ['#B87E7E','#7A9B87','#7D8FA6','#B89A6A','#9C8AA8','#C4AD9E']
    const font = { family:'Noto Sans TC', size:11 }
    const legend = { position:'bottom' as const, labels:{ font, color:'#6B6760', boxWidth:12, padding:10 } }

    const tryDraw = (id:string, config:any) => {
      const canvas = document.getElementById(id) as HTMLCanvasElement
      if (!canvas) return
      if (chartsRef.current[id]) { chartsRef.current[id].destroy() }
      chartsRef.current[id] = new Chart(canvas, config)
    }

    // 含團獎的完整獎金（用 alloc state 裡最新的比例）
    const niTotalWithPool = (m:string) => (personalBonus[m]?.total||0) + niPool*(niAlloc[m]||0)/100
    const wenTotalWithPool = (m:string) => (personalBonus[m]?.total||0) + wenPool*(wenAlloc[m]||0)/100

    tryDraw('c-ni', {
      type:'doughnut',
      data:{ labels:niMembers, datasets:[{ data:niMembers.map(m=>niTotalWithPool(m)), backgroundColor:mColors, borderWidth:2, borderColor:'#FAFAF8' }] },
      options:{ plugins:{ legend, tooltip:{ callbacks:{ label:(ctx:any)=>` ${ctx.label}: $${Math.round(ctx.raw).toLocaleString()}` } } } }
    })
    tryDraw('c-wen', {
      type:'doughnut',
      data:{ labels:wenMembers, datasets:[{ data:wenMembers.map(m=>wenTotalWithPool(m)), backgroundColor:mColors, borderWidth:2, borderColor:'#FAFAF8' }] },
      options:{ plugins:{ legend, tooltip:{ callbacks:{ label:(ctx:any)=>` ${ctx.label}: $${Math.round(ctx.raw).toLocaleString()}` } } } }
    })
    const allM = [...niMembers,...wenMembers]
    const totalWithPool = (m:string) => niMembers.includes(m) ? niTotalWithPool(m) : wenTotalWithPool(m)
    tryDraw('c-all', {
      type:'bar',
      data:{
        labels:allM,
        datasets:[
          { label:'個人作業', data:allM.map(m=>personalBonus[m]?.work||0), backgroundColor:'#7A9B87', borderRadius:3 },
          { label:'組長控案', data:allM.map(m=>personalBonus[m]?.control||0), backgroundColor:'#7D8FA6', borderRadius:3 },
          { label:'團體獎金', data:allM.map(m=>niMembers.includes(m)?niPool*(niAlloc[m]||0)/100:wenPool*(wenAlloc[m]||0)/100), backgroundColor:'#B89A6A', borderRadius:3 },
        ]
      },
      options:{
        responsive:true, plugins:{ legend:{ labels:{ font, color:'#6B6760', boxWidth:12 } } },
        scales:{
          x:{ stacked:true, ticks:{ font, color:'#6B6760' }, grid:{ display:false } },
          y:{ stacked:true, ticks:{ callback:(v:number)=>'$'+v.toLocaleString(), font:{ size:10 }, color:'#A09890' }, grid:{ color:'#EAE5DC' } }
        }
      }
    })
  }

  useEffect(() => {
    if (tab === 'team' && !loading) {
      const t = setTimeout(drawCharts, 100)
      return () => clearTimeout(t)
    }
  }, [tab, loading, payments])

  const niSum = (alloc:typeof niAlloc) => Object.values(alloc).reduce((s,v)=>s+v,0)
  const wenSum = (alloc:typeof wenAlloc) => Object.values(alloc).reduce((s,v)=>s+v,0)

  const allocStatusClass = (sum:number) => sum===100 ? 'var(--sage)' : sum>100 ? 'var(--rose)' : 'var(--amber)'
  const allocStatusText = (sum:number) => sum===100 ? `總和 100% ✓` : sum>100 ? `超出 ${sum-100}%` : `總和 ${sum}% — 剩餘 ${100-sum}%`

  if (loading) return <div className="app"><Sidebar/><div className="main"><div className="loading"><div className="spin"/><span>載入中…</span></div></div></div>

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <div className="page-hd">
          <h1>獎金配發</h1>
          <div className="page-hd-r">
            <span style={{fontSize:11,color:'var(--tx3)'}}>依已實收計算</span>
          </div>
        </div>

        <div className="tabs-bar">
          {([['summary','季度總覽'],['personal','個人統計'],['team','組別圖表']] as const).map(([id,label])=>(
            <div key={id} className={`tab-item ${tab===id?'active':''}`} onClick={()=>setTab(id)}>{label}</div>
          ))}
        </div>

        <div className="page-ct">
          {/* ─── 季度總覽 ─── */}
          {tab==='summary' && <>
            <div className="stat-grid">
              <div className="sc"><div className="sc-l">本季實收</div><div className="sc-v">{fmt(totalReceived)}</div><div className="sc-s">{received.length} 筆</div></div>
              <div className="sc"><div className="sc-l">個人作業 2.5%</div><div className="sc-v" style={{color:'var(--sage)'}}>{fmt(totalReceived*0.025)}</div><div className="sc-s">依實收均分</div></div>
              <div className="sc"><div className="sc-l">組長控案 1.5%</div><div className="sc-v" style={{color:'var(--blue)'}}>{fmt(totalReceived*0.015)}</div><div className="sc-s">固定</div></div>
              <div className="sc"><div className="sc-l">團體池 3%</div><div className="sc-v" style={{color:'var(--amber)'}}>{fmt(totalReceived*0.03)}</div><div className="sc-s">組長季末配發</div></div>
            </div>

            {/* 領銜費 */}
            <div className="card" style={{borderLeft:'3px solid var(--blue)'}}>
              <div className="card-hd"><h2>領銜費（獨立計算）</h2><span className="note">不進入作業獎金分配</span></div>
              {leadingPayments.length === 0 ? (
                <div style={{padding:'16px',color:'var(--tx3)',fontSize:12}}>本季無領銜費收款</div>
              ) : (
                <table><thead><tr><th>案件</th><th>期別</th><th>金額</th><th>狀態</th></tr></thead>
                <tbody>
                  {leadingPayments.map(p=>(
                    <tr key={p.id}><td style={{fontWeight:600}}>{p.caseName}</td>
                    <td className="muted">{p.period}</td>
                    <td className="mono">{fmt(p.amount||0)}</td>
                    <td><span className="tg tg-sage">已收款</span></td></tr>
                  ))}
                </tbody></table>
              )}
            </div>

            {/* 非領銜三成池 */}
            {nonLeadPool > 0 && (
              <div className="card" style={{borderLeft:'3px solid var(--amber)'}}>
                <div className="card-hd"><h2>非領銜案件 — 全公司三成獎金池</h2><span className="note">由所長另行協調</span></div>
                <div style={{padding:'12px 16px',display:'flex',alignItems:'baseline',gap:10}}>
                  <span style={{fontSize:22,fontWeight:700,fontFamily:'var(--m)',color:'var(--amber)'}}>{fmt(nonLeadPool)}</span>
                  <span style={{fontSize:11,color:'var(--tx3)'}}>本季累計</span>
                </div>
              </div>
            )}

            {/* 收款明細 */}
            <div className="card">
              <div className="card-hd"><h2>本季收款明細</h2></div>
              {received.length===0 ? (
                <div style={{padding:'16px',color:'var(--tx3)',fontSize:12}}>本季尚無實收款項</div>
              ) : (
                <table><thead><tr><th>案件</th><th>組別</th><th>承辦</th><th>期別</th><th>實收</th><th>個人 2.5%</th><th>控案 1.5%</th><th>團獎 3%</th></tr></thead>
                <tbody>
                  {received.map(p=>{
                    const caseObj = cases.find(c=>c.id===p.caseId)
                    const isNonLead = caseObj?.leadingType==='非領銜'
                    const base = isNonLead ? (p.amount||0)*0.7 : (p.amount||0)
                    const assignees = p.caseAssignees||[]
                    return (
                      <tr key={p.id}>
                        <td style={{fontWeight:600}}>{p.caseName}</td>
                        <td className="muted">{p.caseTeam}</td>
                        <td>{assignees.join('、')}</td>
                        <td className="muted">{p.period}</td>
                        <td className="mono">{fmt(p.amount||0)}</td>
                        <td className="mono" style={{color:'var(--sage)'}}>
                          {fmt(base*0.025/Math.max(1,assignees.length))}
                          {isNonLead && <span className="muted" style={{fontSize:10}}>(70%)</span>}
                        </td>
                        <td className="mono" style={{color:'var(--blue)'}}>{fmt(base*0.015)}</td>
                        <td className="mono" style={{color:'var(--amber)'}}>{fmt(base*0.03)}</td>
                      </tr>
                    )
                  })}
                  <tr style={{background:'var(--bgh)',fontWeight:700}}>
                    <td colSpan={4} style={{textAlign:'right',fontSize:11,color:'var(--tx3)'}}>合計</td>
                    <td className="mono">{fmt(totalReceived)}</td>
                    <td className="mono" style={{color:'var(--sage)'}}>{fmt(totalReceived*0.025)}</td>
                    <td className="mono" style={{color:'var(--blue)'}}>{fmt(totalReceived*0.015)}</td>
                    <td className="mono" style={{color:'var(--amber)'}}>{fmt(totalReceived*0.03)}</td>
                  </tr>
                </tbody></table>
              )}
            </div>
          </>}

          {/* ─── 個人統計 ─── */}
          {tab==='personal' && <>
            <div className="card" style={{marginBottom:14}}>
              <div className="card-hd"><h2>個人獎金一覽</h2></div>
              <div style={{padding:'14px 16px'}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(145px,1fr))',gap:10}}>
                  {Object.keys(MEMBERS).map(m=>{
                    const b = personalBonus[m]||{work:0,control:0,total:0}
                    const isLeader = Object.values(LEADERS).includes(m)
                    return (
                      <div key={m} className="pb">
                        <div className="pb-top">
                          <div className="av" style={{background:PC[m]||'#6B6760',width:26,height:26,fontSize:11}}>{m[0]}</div>
                          <div>
                            <div style={{fontSize:12,fontWeight:700}}>{m}</div>
                            <div style={{fontSize:10,color:'var(--tx3)'}}>{MEMBERS[m as keyof typeof MEMBERS]}{isLeader?'·組長':''}</div>
                          </div>
                        </div>
                        <div className="pb-total">{fmt(b.total)}</div>
                        <div className="pb-line"><span>個人承辦</span><span style={{fontFamily:'var(--m)',fontSize:11}}>{fmt(b.work)}</span></div>
                        {isLeader && <div className="pb-line"><span>組長控案</span><span style={{fontFamily:'var(--m)',fontSize:11}}>{fmt(b.control)}</span></div>}
                        <div className="pb-line" style={{color:'var(--tx3)'}}><span>團獎</span><span>待配</span></div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-hd"><h2>3% 團體獎金池 — 組長比例配發</h2><span className="note">輸入各成員%，合計=100%</span></div>
              <div style={{padding:'14px 16px'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                  {/* 妮組 */}
                  <div className="pool-panel">
                    <div className="pool-phd">
                      <h3 style={{fontSize:12,fontWeight:700}}>妮組 · 慈妮配發</h3>
                      <span style={{fontSize:12,fontFamily:'var(--m)',fontWeight:600}}>{fmt(niPool)}</span>
                    </div>
                    <div className="pool-rows">
                      {['慈妮','紘齊','韋萱'].map(m=>(
                        <div key={m} className="pr">
                          <div className="av" style={{background:PC[m],width:22,height:22,fontSize:9}}>{m[0]}</div>
                          <span style={{fontSize:12,fontWeight:600}}>{m}</span>
                          <input className="pr-pct" type="number" value={niAlloc[m]||0}
                            onChange={e=>setNiAlloc(p=>({...p,[m]:parseFloat(e.target.value)||0}))} />
                          <span style={{fontSize:11,color:'var(--tx3)'}}>%</span>
                          <span style={{fontSize:11,fontFamily:'var(--m)',color:'var(--sage)',fontWeight:600,textAlign:'right'}}>
                            {fmt(niPool*(niAlloc[m]||0)/100)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="pool-foot">
                      <span style={{fontSize:11,color:allocStatusClass(niSum(niAlloc)),fontWeight:600}}>
                        {allocStatusText(niSum(niAlloc))}
                      </span>
                      <button className="btn btn-primary btn-sm" disabled={niSum(niAlloc)!==100}
                        onClick={()=>setNiConfirmed(true)}>確認配發</button>
                    </div>
                    {niConfirmed && (
                      <div style={{borderTop:'1px solid var(--bdl)',padding:'10px 12px',background:'var(--sage-l)'}}>
                        <div style={{fontSize:10,fontWeight:700,color:'var(--sage)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:8}}>配發結果（含團獎）</div>
                        {['慈妮','紘齊','韋萱'].map(m=>(
                          <div key={m} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:'1px solid rgba(122,155,135,.2)'}}>
                            <div style={{display:'flex',alignItems:'center',gap:6}}>
                              <div className="av" style={{background:PC[m],width:20,height:20,fontSize:9}}>{m[0]}</div>
                              <span style={{fontSize:12,fontWeight:600}}>{m}</span>
                            </div>
                            <div style={{textAlign:'right'}}>
                              <div style={{fontFamily:'var(--m)',fontSize:13,fontWeight:700,color:'var(--sage)'}}>
                                {fmt((personalBonus[m]?.total||0) + niPool*(niAlloc[m]||0)/100)}
                              </div>
                              <div style={{fontSize:10,color:'var(--tx3)'}}>
                                作業 {fmt(personalBonus[m]?.total||0)} ＋ 團獎 {fmt(niPool*(niAlloc[m]||0)/100)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* 文組 */}
                  <div className="pool-panel">
                    <div className="pool-phd">
                      <h3 style={{fontSize:12,fontWeight:700}}>文組 · 文靜配發</h3>
                      <span style={{fontSize:12,fontFamily:'var(--m)',fontWeight:600}}>{fmt(wenPool)}</span>
                    </div>
                    <div className="pool-rows">
                      {['文靜','Jenny','旭庭','方謙'].map(m=>(
                        <div key={m} className="pr">
                          <div className="av" style={{background:PC[m]||'#6B6760',width:22,height:22,fontSize:9}}>{m[0]}</div>
                          <span style={{fontSize:12,fontWeight:600}}>{m}</span>
                          <input className="pr-pct" type="number" value={wenAlloc[m]||0}
                            onChange={e=>setWenAlloc(p=>({...p,[m]:parseFloat(e.target.value)||0}))} />
                          <span style={{fontSize:11,color:'var(--tx3)'}}>%</span>
                          <span style={{fontSize:11,fontFamily:'var(--m)',color:'var(--sage)',fontWeight:600,textAlign:'right'}}>
                            {fmt(wenPool*(wenAlloc[m]||0)/100)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="pool-foot">
                      <span style={{fontSize:11,color:allocStatusClass(wenSum(wenAlloc)),fontWeight:600}}>
                        {allocStatusText(wenSum(wenAlloc))}
                      </span>
                      <button className="btn btn-primary btn-sm" disabled={wenSum(wenAlloc)!==100}
                        onClick={()=>setWenConfirmed(true)}>確認配發</button>
                    </div>
                    {wenConfirmed && (
                      <div style={{borderTop:'1px solid var(--bdl)',padding:'10px 12px',background:'var(--sage-l)'}}>
                        <div style={{fontSize:10,fontWeight:700,color:'var(--sage)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:8}}>配發結果（含團獎）</div>
                        {['文靜','Jenny','旭庭','方謙'].map(m=>(
                          <div key={m} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:'1px solid rgba(122,155,135,.2)'}}>
                            <div style={{display:'flex',alignItems:'center',gap:6}}>
                              <div className="av" style={{background:PC[m]||'#6B6760',width:20,height:20,fontSize:9}}>{m[0]}</div>
                              <span style={{fontSize:12,fontWeight:600}}>{m}</span>
                            </div>
                            <div style={{textAlign:'right'}}>
                              <div style={{fontFamily:'var(--m)',fontSize:13,fontWeight:700,color:'var(--sage)'}}>
                                {fmt((personalBonus[m]?.total||0) + wenPool*(wenAlloc[m]||0)/100)}
                              </div>
                              <div style={{fontSize:10,color:'var(--tx3)'}}>
                                作業 {fmt(personalBonus[m]?.total||0)} ＋ 團獎 {fmt(wenPool*(wenAlloc[m]||0)/100)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>}

          {/* ─── 組別圖表 ─── */}
          {tab==='team' && <>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              <div className="card"><div className="card-hd"><h2>妮組 獎金分布（含團獎）</h2></div><div style={{padding:14}}><canvas id="c-ni" height={200}/></div></div>
              <div className="card"><div className="card-hd"><h2>文組 獎金分布（含團獎）</h2></div><div style={{padding:14}}><canvas id="c-wen" height={200}/></div></div>
            </div>
            <div className="card"><div className="card-hd"><h2>全員獎金比較（含團獎）</h2></div><div style={{padding:14}}><canvas id="c-all" height={180}/></div></div>
          </>}
        </div>
      </div>
    </div>
  )
}
