'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

const TYPES = ['都更前期','都更','法拍','一般件','法院案','買賣','地上權','代金','國產署','合理市場租金參考','容積代金試算','公允價值評估','瑕疵','捷運聯開','危老','權利變換','其他']
const PRIORITIES = ['急件','優先','普通']
const TEAMS = ['妮組','文組','未派']

function subtractWorkdays(dateStr: string, days: number): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  let count = 0
  while (count < days) {
    d.setDate(d.getDate() - 1)
    if (d.getDay() !== 0 && d.getDay() !== 6) count++
  }
  return d.toISOString().slice(0, 10)
}

interface Period { id: number; label: string; pct: string }

const emptyForm = () => ({
  name: '', clientId: '', clientName: '', caseType: '',
  team: '妮組', priority: '普通',
  city: '', district: '', landSection: '', landNo: '', buildingNo: '', doorPlate: '',
  contractAmount: '',
  leadingType: '其他' as '領銜'|'非領銜'|'其他',
  leadingFee: '',
  assignDate: '', siteVisitDate: '', priceDate: '', dueDate: '', staffDoneDate: '', actualDueDate: '',
  zhCount: false, zhCountQty: '1', zhCountCopies: '1',
  zhAbstract: false, zhAbstractQty: '1', zhAbstractCopies: '1',
  zhReport: false, zhReportQty: '1', zhReportCopies: '1',
  zhDigital: false, zhDigitalQty: '1', zhDigitalCopies: '1',
  zhCD: false, zhCDQty: '1', zhCDCopies: '1',
  zhNoSealAbstract: false, zhNoSealAbstractQty: '1', zhNoSealAbstractCopies: '1',
  enCount: false, enCountQty: '1', enCountCopies: '1',
  enAbstract: false, enAbstractQty: '1', enAbstractCopies: '1',
  enReport: false, enReportQty: '1', enReportCopies: '1',
  enDigital: false, enDigitalQty: '1', enDigitalCopies: '1',
  enCD: false, enCDQty: '1', enCDCopies: '1',
  importantNote: '',
  contactIdx: 0, contactPhone: '', contactMobile: '',
})

const STEPS = ['案件建立', '案件資訊', '報告成果', '費用分期']

export default function CasesNewPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(emptyForm())
  const [clients, setClients] = useState<any[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [clientDD, setClientDD] = useState(false)
  const [saving, setSaving] = useState(false)
  // 分期設定
  const [servicePeriods, setServicePeriods] = useState<Period[]>([{ id: 1, label: '第1期', pct: '100' }])
  // 領銜案：領銜費分兩期各50%（固定），一般服務費用自訂分期
  const u = (field: string) => (v: any) => setForm(p => ({ ...p, [field]: v }))

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : []))
  }, [])

  const clientOpts = clients.filter(c => c.name.includes(clientSearch))

  const addPeriod = () => {
    const remaining = 100 - servicePeriods.reduce((s, p) => s + (parseFloat(p.pct) || 0), 0)
    setServicePeriods(prev => [...prev, { id: Date.now(), label: `第${prev.length + 1}期`, pct: String(Math.max(0, remaining)) }])
  }
  const removePeriod = (id: number) => setServicePeriods(prev => prev.filter(p => p.id !== id))
  const updatePeriod = (id: number, field: string, val: string) =>
    setServicePeriods(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p))

  const totalPct = servicePeriods.reduce((s, p) => s + (parseFloat(p.pct) || 0), 0)
  const amt = parseFloat(form.contractAmount) || 0

  // 計算公司分紅（非領銜記錄用，但分期仍用全額）
  const companyShare = form.leadingType === '非領銜' ? amt * 0.3 : 0
  const serviceAmt = amt  // 無論哪種類型，分期都以全額為基礎

  const handleSubmit = async () => {
    if (!form.name?.trim() && !form.clientName) { alert('請填寫案件名稱或委託單位'); return }
    setSaving(true)
    const addrParts = [form.city, form.district, form.landSection,
      form.landNo ? '地號' + form.landNo : '', form.buildingNo ? '建號' + form.buildingNo : '', form.doorPlate
    ].filter(Boolean)

    // 組建 periods 說明字串
    const periodsNote = servicePeriods.map(p => `${p.label} ${p.pct}%`).join('、')
    const leadingNote = form.leadingType === '領銜'
      ? `領銜費:${form.leadingFee||'—'}元(兩期各50%)；服務費用分期:${periodsNote}`
      : form.leadingType === '非領銜'
      ? `非領銜：公司分紅30%=${companyShare.toLocaleString()}元；服務費用100%分期:${periodsNote}`
      : `服務費用分期:${periodsNote}`

    const payload = {
      name: form.name?.trim() || form.clientName || '新案件',
      clientId: form.clientId,
      clientName: form.clientName,
      caseType: form.caseType,
      address: addrParts.join(' '),
      team: form.team,
      priority: form.priority,
      contractAmount: amt || null,
      leadingType: form.leadingType,
      leadingFee: form.leadingType === '領銜' ? form.leadingFee : null,
      companyShare: form.leadingType === '非領銜' && amt > 0 ? String(Math.round(amt * 0.3)) : null,
      assignDate: form.assignDate,
      dueDate: form.dueDate,
      progressNote: form.importantNote ? `【重要提醒】${form.importantNote}` : '',
      status: '未開始',
      // 把費用分期資訊寫入進度備註
      documentNotes: leadingNote,
    }
    try {
      const res = await fetch('/api/cases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '未知錯誤' }))
        alert('建立失敗：' + (err.error || res.status)); return
      }
      router.push('/cases')
    } finally { setSaving(false) }
  }

  const SubRow = ({ label, ck, setck, qty, setqty, cop, setcop }: any) => (
    <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr 70px 70px', gap: 8, alignItems: 'center', marginBottom: 5 }}>
      <input type="checkbox" checked={ck} onChange={e => setck(e.target.checked)} style={{ accentColor: 'var(--blue)' }} />
      <span style={{ fontSize: 12, color: ck ? 'var(--tx)' : 'var(--tx3)' }}>{label}</span>
      <input className="fi" type="number" min="1" placeholder="式" disabled={!ck}
        value={qty} onChange={e => setqty(e.target.value)}
        style={{ padding: '3px 5px', fontSize: 11, opacity: ck ? 1 : 0.4 }} />
      <input className="fi" type="number" min="1" placeholder="份" disabled={!ck}
        value={cop} onChange={e => setcop(e.target.value)}
        style={{ padding: '3px 5px', fontSize: 11, opacity: ck ? 1 : 0.4 }} />
    </div>
  )

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <div className="page-hd">
          <h1>案件建立</h1>
          <div className="page-hd-r">
            <button className="btn btn-ghost btn-sm" onClick={() => router.push('/cases')}>← 返回查詢</button>
          </div>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--bd)', padding: '0 20px', background: 'var(--bgc)' }}>
          {STEPS.map((label, i) => (
            <button key={i} onClick={() => i < step || step > 0 ? setStep(i) : null} style={{
              flex: 1, padding: '12px 4px', fontSize: 12, fontWeight: step === i ? 700 : 400,
              color: step === i ? 'var(--blue)' : step > i ? 'var(--tx2)' : 'var(--tx3)',
              background: 'none', border: 'none',
              borderBottom: step === i ? '2px solid var(--blue)' : '2px solid transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%', fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step > i ? 'var(--blue)' : step === i ? 'var(--blue)' : 'var(--bd)',
                color: '#fff',
              }}>{step > i ? '✓' : i + 1}</span>
              {label}
            </button>
          ))}
        </div>

        <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>

          {/* ── STEP 0 案件建立 ── */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="fg">
                <label>委託單位 *</label>
                <div className="dd-wrap">
                  <input className="fi" value={clientSearch}
                    onChange={e => { setClientSearch(e.target.value); setClientDD(true); setForm(p => ({ ...p, clientId: '', clientName: '' })) }}
                    onFocus={() => setClientDD(true)} onBlur={() => setTimeout(() => setClientDD(false), 200)}
                    placeholder="搜尋客戶名稱…" />
                  {clientDD && clientOpts.length > 0 && (
                    <div className="dd">
                      {clientOpts.slice(0, 8).map((c: any) => (
                        <div key={c.id} className="dd-opt" onClick={() => {
                          setForm(p => ({ ...p, clientId: c.id, clientName: c.name, contactIdx: 0, contactPhone: '', contactMobile: '' }))
                          setClientSearch(c.name); setClientDD(false)
                        }}>{c.name} <span className="dd-sub">{c.clientType}</span></div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 選擇承辦窗口 */}
              {form.clientId && (() => {
                const client = clients.find((c: any) => c.id === form.clientId)
                if (!client) return null
                const ctList = [1, 2, 3, 4].map(i => ({
                  idx: i - 1, name: (client as any)[`contact${i}Name`] || '',
                  title: (client as any)[`contact${i}Title`] || '',
                  phone: (client as any)[`contact${i}Phone`] || '',
                  mobile: (client as any)[`contact${i}Mobile`] || '',
                })).filter(ct => ct.name)
                if (!ctList.length) return null
                return (
                  <div className="fg">
                    <label>承辦窗口</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {ctList.map((ct, i) => (
                        <label key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
                          border: `1px solid ${form.contactIdx === ct.idx ? 'var(--blue)' : 'var(--bd)'}`,
                          background: form.contactIdx === ct.idx ? 'color-mix(in srgb, var(--blue) 8%, transparent)' : 'var(--bgc)',
                        }}>
                          <input type="radio" style={{ accentColor: 'var(--blue)' }}
                            checked={form.contactIdx === ct.idx}
                            onChange={() => setForm(p => ({ ...p, contactIdx: ct.idx, contactPhone: ct.phone, contactMobile: ct.mobile }))} />
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{ct.name}</span>
                          {ct.title && <span style={{ fontSize: 11, color: 'var(--tx3)' }}>{ct.title}</span>}
                          {(ct.phone || ct.mobile) && (
                            <span style={{ fontSize: 11, fontFamily: 'var(--m)', color: 'var(--tx2)', marginLeft: 'auto' }}>
                              {ct.phone || ct.mobile}
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })()}

              <div className="row2">
                <div className="fg"><label>組別</label>
                  <select className="fi" value={form.team} onChange={e => u('team')(e.target.value)}>
                    {TEAMS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="fg"><label>順位</label>
                  <select className="fi" value={form.priority} onChange={e => u('priority')(e.target.value)}>
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="fg">
                <label>重要提醒（選填）</label>
                <input className="fi" value={form.importantNote} onChange={e => u('importantNote')(e.target.value)} placeholder="臨時提醒、注意事項…" />
              </div>
            </div>
          )}

          {/* ── STEP 1 案件資訊 ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="row2">
                <div className="fg"><label>案件名稱 *</label>
                  <input className="fi" value={form.name} onChange={e => u('name')(e.target.value)} />
                </div>
                <div className="fg"><label>案件類型</label>
                  <select className="fi" value={form.caseType} onChange={e => u('caseType')(e.target.value)}>
                    <option value="">—</option>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx3)', letterSpacing: '.05em', marginBottom: 8 }}>勘估資訊</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <div className="fg"><label>縣市</label><input className="fi" value={form.city} onChange={e => u('city')(e.target.value)} /></div>
                  <div className="fg"><label>區域</label><input className="fi" value={form.district} onChange={e => u('district')(e.target.value)} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <div className="fg"><label>地段</label><input className="fi" value={form.landSection} onChange={e => u('landSection')(e.target.value)} /></div>
                  <div className="fg"><label>地號</label><input className="fi" value={form.landNo} onChange={e => u('landNo')(e.target.value)} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div className="fg"><label>建號</label><input className="fi" value={form.buildingNo} onChange={e => u('buildingNo')(e.target.value)} /></div>
                  <div className="fg"><label>門牌</label><input className="fi" value={form.doorPlate} onChange={e => u('doorPlate')(e.target.value)} /></div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2 報告成果 ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx3)', letterSpacing: '.05em', marginBottom: 8 }}>繳交資訊</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--tx2)' }}>中文</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr 70px 70px', gap: 8, marginBottom: 4 }}>
                      <span /><span style={{ fontSize: 10, color: 'var(--tx3)', fontWeight: 700 }}>項目</span>
                      <span style={{ fontSize: 10, color: 'var(--tx3)', fontWeight: 700 }}>式</span>
                      <span style={{ fontSize: 10, color: 'var(--tx3)', fontWeight: 700 }}>份</span>
                    </div>
                    <SubRow label="數字" ck={form.zhCount} setck={u('zhCount')} qty={form.zhCountQty} setqty={u('zhCountQty')} cop={form.zhCountCopies} setcop={u('zhCountCopies')} />
                    <SubRow label="摘要" ck={form.zhAbstract} setck={u('zhAbstract')} qty={form.zhAbstractQty} setqty={u('zhAbstractQty')} cop={form.zhAbstractCopies} setcop={u('zhAbstractCopies')} />
                    <SubRow label="報告書" ck={form.zhReport} setck={u('zhReport')} qty={form.zhReportQty} setqty={u('zhReportQty')} cop={form.zhReportCopies} setcop={u('zhReportCopies')} />
                    <SubRow label="電子檔" ck={form.zhDigital} setck={u('zhDigital')} qty={form.zhDigitalQty} setqty={u('zhDigitalQty')} cop={form.zhDigitalCopies} setcop={u('zhDigitalCopies')} />
                    <SubRow label="光碟" ck={form.zhCD} setck={u('zhCD')} qty={form.zhCDQty} setqty={u('zhCDQty')} cop={form.zhCDCopies} setcop={u('zhCDCopies')} />
                    <SubRow label="免簽證摘要" ck={form.zhNoSealAbstract} setck={u('zhNoSealAbstract')} qty={form.zhNoSealAbstractQty} setqty={u('zhNoSealAbstractQty')} cop={form.zhNoSealAbstractCopies} setcop={u('zhNoSealAbstractCopies')} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--tx2)' }}>英文</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr 70px 70px', gap: 8, marginBottom: 4 }}>
                      <span /><span style={{ fontSize: 10, color: 'var(--tx3)', fontWeight: 700 }}>項目</span>
                      <span style={{ fontSize: 10, color: 'var(--tx3)', fontWeight: 700 }}>式</span>
                      <span style={{ fontSize: 10, color: 'var(--tx3)', fontWeight: 700 }}>份</span>
                    </div>
                    <SubRow label="數字" ck={form.enCount} setck={u('enCount')} qty={form.enCountQty} setqty={u('enCountQty')} cop={form.enCountCopies} setcop={u('enCountCopies')} />
                    <SubRow label="摘要" ck={form.enAbstract} setck={u('enAbstract')} qty={form.enAbstractQty} setqty={u('enAbstractQty')} cop={form.enAbstractCopies} setcop={u('enAbstractCopies')} />
                    <SubRow label="報告書" ck={form.enReport} setck={u('enReport')} qty={form.enReportQty} setqty={u('enReportQty')} cop={form.enReportCopies} setcop={u('enReportCopies')} />
                    <SubRow label="電子檔" ck={form.enDigital} setck={u('enDigital')} qty={form.enDigitalQty} setqty={u('enDigitalQty')} cop={form.enDigitalCopies} setcop={u('enDigitalCopies')} />
                    <SubRow label="光碟" ck={form.enCD} setck={u('enCD')} qty={form.enCDQty} setqty={u('enCDQty')} cop={form.enCDCopies} setcop={u('enCDCopies')} />
                  </div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx3)', letterSpacing: '.05em', marginBottom: 8 }}>日期資訊</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div className="fg"><label>交辦日期</label><input type="date" className="fi" value={form.assignDate} onChange={e => u('assignDate')(e.target.value)} /></div>
                  <div className="fg"><label>現勘日期</label><input type="date" className="fi" value={form.siteVisitDate} onChange={e => u('siteVisitDate')(e.target.value)} /></div>
                  <div className="fg"><label>價格日期</label><input type="date" className="fi" value={form.priceDate} onChange={e => u('priceDate')(e.target.value)} /></div>
                  <div className="fg">
                    <label>預計出件日期</label>
                    <input type="date" className="fi" value={form.dueDate}
                      onChange={e => { const d = e.target.value; setForm(p => ({ ...p, dueDate: d, staffDoneDate: subtractWorkdays(d, 3) })) }} />
                  </div>
                  <div className="fg">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      承辦完成日期 <span style={{ fontSize: 10, color: 'var(--tx3)' }}>(出件前3工作日)</span>
                    </label>
                    <input type="date" className="fi" value={form.staffDoneDate} onChange={e => u('staffDoneDate')(e.target.value)} />
                  </div>
                  <div className="fg"><label>實際出件日期</label><input type="date" className="fi" value={form.actualDueDate} onChange={e => u('actualDueDate')(e.target.value)} /></div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3 費用分期 ── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* 服務費用 + 領銜類型 */}
              <div className="row2">
                <div className="fg">
                  <label>服務費用總額（元）</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ color: 'var(--tx3)' }}>$</span>
                    <input className="fi" type="number" value={form.contractAmount} onChange={e => u('contractAmount')(e.target.value)} />
                  </div>
                </div>
                <div className="fg">
                  <label>領銜類型</label>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    {(['領銜', '非領銜', '其他'] as const).map(t => (
                      <button key={t} onClick={() => u('leadingType')(t)}
                        style={{
                          flex: 1, padding: '7px 4px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                          border: `1.5px solid ${form.leadingType === t ? 'var(--blue)' : 'var(--bd)'}`,
                          background: form.leadingType === t ? 'var(--blue)' : 'var(--bgc)',
                          color: form.leadingType === t ? '#fff' : 'var(--tx)',
                        }}>{t}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 領銜案 */}
              {form.leadingType === '領銜' && (
                <div style={{ background: 'color-mix(in srgb, var(--blue) 6%, transparent)', borderRadius: 8, padding: 14, border: '1px solid color-mix(in srgb, var(--blue) 20%, transparent)' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: 'var(--blue)' }}>領銜費設定</div>
                  <div className="fg" style={{ marginBottom: 12 }}>
                    <label>領銜費金額（元）</label>
                    <input className="fi" type="number" value={form.leadingFee} onChange={e => u('leadingFee')(e.target.value)} placeholder="領銜費總金額" />
                  </div>
                  {form.leadingFee && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[1, 2].map(i => (
                        <div key={i} style={{ flex: 1, padding: '8px 12px', borderRadius: 6, background: 'var(--bgc)', border: '1px solid var(--bd)', textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: 'var(--tx3)', marginBottom: 2 }}>第 {i} 期（50%）</div>
                          <div style={{ fontWeight: 700, fontFamily: 'var(--m)' }}>
                            ${(parseFloat(form.leadingFee || '0') * 0.5).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 非領銜案 - 公司分紅說明 */}
              {form.leadingType === '非領銜' && amt > 0 && (
                <div style={{ background: 'color-mix(in srgb, #f59e0b 8%, transparent)', borderRadius: 8, padding: 14, border: '1px solid color-mix(in srgb, #f59e0b 25%, transparent)' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: '#b45309' }}>非領銜－公司分紅記錄</div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, alignItems: 'center' }}>
                    <div>
                      <div style={{ color: 'var(--tx3)', marginBottom: 2 }}>公司分紅（30%，僅記錄用）</div>
                      <div style={{ fontWeight: 700, fontFamily: 'var(--m)', fontSize: 16 }}>${companyShare.toLocaleString()}</div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--tx3)', lineHeight: 1.5 }}>
                      ✓ 分期設定以服務費用總額 ${amt.toLocaleString()} 為基礎
                    </div>
                  </div>
                </div>
              )}

              {/* 一般服務費用分期 */}
              <div style={{ border: '1px solid var(--bd)', borderRadius: 8, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    {form.leadingType === '領銜' ? '一般服務費用' : '服務費用'}分期設定
                  </div>
                  <button className="btn btn-sm" onClick={addPeriod}>＋ 新增期別</button>
                </div>

                {/* 表頭 */}
                <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1fr 36px', gap: 8, marginBottom: 6 }}>
                  {['期別', '比例 (%)', amt > 0 ? `金額（基底 $${serviceAmt.toLocaleString()}）` : '金額（元）', ''].map((h, i) => (
                    <span key={i} style={{ fontSize: 10, fontWeight: 700, color: 'var(--tx3)' }}>{h}</span>
                  ))}
                </div>

                {servicePeriods.map(p => (
                  <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1fr 36px', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                    <input className="fi" value={p.label} onChange={e => updatePeriod(p.id, 'label', e.target.value)}
                      style={{ fontSize: 12, padding: '4px 8px' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input className="fi" type="number" min="0" max="100" value={p.pct}
                        onChange={e => updatePeriod(p.id, 'pct', e.target.value)}
                        style={{ fontSize: 12, padding: '4px 8px', textAlign: 'right' }} />
                      <span style={{ fontSize: 11, color: 'var(--tx3)' }}>%</span>
                    </div>
                    <div style={{ fontSize: 12, fontFamily: 'var(--m)', color: 'var(--tx2)', padding: '4px 8px', background: 'var(--bgh)', borderRadius: 5 }}>
                      {amt > 0 ? '$' + Math.round(serviceAmt * (parseFloat(p.pct) || 0) / 100).toLocaleString() : '—'}
                    </div>
                    <button onClick={() => removePeriod(p.id)}
                      style={{ width: 28, height: 28, borderRadius: 5, border: '1px solid var(--bd)', background: 'var(--bgc)', cursor: 'pointer', color: 'var(--tx3)', fontSize: 14 }}>×</button>
                  </div>
                ))}

                {/* 合計 */}
                <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: totalPct === 100 ? 'var(--tx2)' : 'var(--rose)', fontWeight: 600 }}>
                    合計：{totalPct.toFixed(0)}%
                    {totalPct !== 100 && <span style={{ marginLeft: 4 }}>⚠ 應為 100%</span>}
                  </span>
                  {amt > 0 && <span style={{ fontFamily: 'var(--m)', fontWeight: 700 }}>${serviceAmt.toLocaleString()}</span>}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--bd)' }}>
            <button className="btn btn-ghost" onClick={() => step === 0 ? router.push('/cases') : setStep(s => s - 1)}>
              {step === 0 ? '取消' : '← 上一步'}
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              {step < STEPS.length - 1
                ? <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>下一步 →</button>
                : <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                  {saving ? '建立中…' : '✓ 建立案件'}
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
