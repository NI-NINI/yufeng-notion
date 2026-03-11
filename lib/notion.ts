import { Client } from '@notionhq/client'

export const notion = new Client({ auth: process.env.NOTION_TOKEN })

export const DB_IDS = {
  clients:  process.env.NOTION_CLIENT_DB_ID!,
  cases:    process.env.NOTION_CASE_DB_ID || '3208c9d4978c8133839ed912025fd2e0',
  payments: process.env.NOTION_PAYMENT_DB_ID!,
}

// ── 型別 ──────────────────────────────────────────────────────

export interface Client_ {
  id: string; name: string; taxId: string; phone: string; fax: string
  address: string
  contact1Name: string; contact1Phone: string; contact1Email: string
  contact2Name: string; contact2Phone: string; contact2Email: string
  contact3Name: string; contact3Phone: string; contact3Email: string
  contact4Name: string; contact4Phone: string; contact4Email: string
  giftDragonBoat: boolean; giftMidAutumn: boolean; giftNewYear: boolean; giftYearEnd: boolean
  isGiftTarget: boolean; clientType: string; notes: string; createdAt: string
}

// 新 DB 對應的案件型別
export interface Case_ {
  id: string
  caseNumber: string       // 案件編號 (title)
  name: string             // 案件簡稱 (rich_text)
  clientId: string         // 無 relation，留空
  clientName: string       // 委託單位 (rich_text)
  caseType: string         // 估價目的 (rich_text)
  address: string          // 標的物地址 (rich_text)
  contractAmountText: string // 案件金額 (rich_text)
  contractAmount: number | null
  team: string             // 組別 (select): 妮組/文組/舊案(妮+文)
  assignees: string[]      // 承辦人 (select → 陣列)
  appraisers: string[]     // 簽證(負責)估價師 (multi_select)
  status: string           // 由 checkbox 推算
  isActive: boolean        // 是否進行中
  isClosed: boolean        // 是否已結案
  dueDate: string          // 出件期限
  progressNote: string     // 進度
  location: string         // 地點
  redFlag: boolean
  redFlagNote: string
  updatedAt: string
  // 向後相容欄位（讓前端不需要大改）
  assignDate: string
  priority: string
  difficulty: string
  stuckReason: string
  documentNotes: string
  discountRate: number | null
  contractDate: string
  plannedDate: string
  qualityScore: number | null
  progressNoteExtra: string
  quarter: string
  bonusQuarter: string
  year: string
  bonus25: number | null
  bonus15: number | null
  bonus3: number | null
  difficultyWeight: number | null
}

export interface Payment_ {
  id: string; title: string; caseId: string; caseName: string
  caseTeam: string; caseAssignees: string[]; caseContractAmount: number | null
  period: string; amount: number | null; year: number | null; quarter: string
  status: string; receiptNo: string; invoiceDate: string; receivedDate: string; notes: string
}

// ── helpers ───────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prop = (p: any, k: string) => p.properties?.[k]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function text(page: any, key: string): string {
  const p = prop(page, key)
  if (!p) return ''
  if (p.type === 'title')      return p.title?.map((t: any) => t.plain_text).join('') ?? ''
  if (p.type === 'rich_text')  return p.rich_text?.map((t: any) => t.plain_text).join('') ?? ''
  if (p.type === 'phone_number') return p.phone_number ?? ''
  if (p.type === 'email')      return p.email ?? ''
  return ''
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sel  = (page: any, key: string): string => prop(page, key)?.select?.name ?? ''
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const msel = (page: any, key: string): string[] => prop(page, key)?.multi_select?.map((o: any) => o.name) ?? []
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const num  = (page: any, key: string): number | null => prop(page, key)?.number ?? null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dt   = (page: any, key: string): string => prop(page, key)?.date?.start ?? ''
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chk  = (page: any, key: string): boolean => prop(page, key)?.checkbox ?? false
const rt   = (s: string) => [{ text: { content: s } }]

// ── toClient ─────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toClient(page: any): Client_ {
  const giftDragonBoat = chk(page, '端午送禮')
  const giftMidAutumn  = chk(page, '中秋送禮')
  const giftNewYear    = chk(page, '春節送禮')
  const giftYearEnd    = chk(page, '年節送禮')
  return {
    id: page.id,
    name: text(page, '委託單位名稱'),
    taxId: text(page, '統一編號'),
    phone: text(page, '公司電話'),
    fax: text(page, '傳真'),
    address: text(page, '公司地址'),
    contact1Name: text(page, '聯絡窗口1_姓名'),
    contact1Phone: text(page, '聯絡窗口1_電話'),
    contact1Email: text(page, '聯絡窗口1_Email'),
    contact2Name: text(page, '聯絡窗口2_姓名'),
    contact2Phone: text(page, '聯絡窗口2_電話'),
    contact2Email: text(page, '聯絡窗口2_Email'),
    contact3Name: text(page, '聯絡窗口3_姓名'),
    contact3Phone: text(page, '聯絡窗口3_電話'),
    contact3Email: text(page, '聯絡窗口3_Email'),
    contact4Name: text(page, '聯絡窗口4_姓名'),
    contact4Phone: text(page, '聯絡窗口4_電話'),
    contact4Email: text(page, '聯絡窗口4_Email'),
    giftDragonBoat, giftMidAutumn, giftNewYear, giftYearEnd,
    isGiftTarget: chk(page, '送禮對象') || giftDragonBoat || giftMidAutumn || giftNewYear || giftYearEnd,
    clientType: sel(page, '客戶類型'),
    notes: text(page, '備註'),
    createdAt: prop(page, '建立日期')?.created_time ?? '',
  }
}

// ── toCase ───────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toCase(page: any, clientMap: Record<string, string> = {}): Case_ {
  const isActive = chk(page, '是否進行中')
  const isClosed = chk(page, '是否已結案')
  const status   = isClosed ? '已完成' : isActive ? '進行中' : '未啟動'
  const assigneeSingle = sel(page, '承辦人')
  const amtText  = text(page, '案件金額')
  const amtNum   = amtText ? parseFloat(amtText.replace(/[^0-9.]/g, '')) : null
  // 委託單位：已改為 relation，同時 fallback 到文字
  const clientIds = prop(page, '委託單位')?.relation?.map((r: any) => r.id) ?? []
  const clientId = clientIds[0] ?? ''

  return {
    id: page.id,
    caseNumber: text(page, '案件編號'),
    name: text(page, '案件簡稱') || text(page, '案件編號'),
    clientId,
    clientName: clientIds.map(id => clientMap[id] || '').filter(Boolean).join(', '),
    caseType: text(page, '估價目的'),
    address: text(page, '標的物地址'),
    contractAmountText: amtText,
    contractAmount: amtNum && !isNaN(amtNum) ? amtNum : null,
    team: sel(page, '組別'),
    assignees: assigneeSingle ? [assigneeSingle] : [],
    appraisers: msel(page, '簽證(負責)估價師'),
    status, isActive, isClosed,
    dueDate: dt(page, '出件期限'),
    progressNote: text(page, '進度'),
    location: text(page, '地點'),
    redFlag: chk(page, '業務紅燈'),
    redFlagNote: text(page, '紅燈備註'),
    updatedAt: '',
    // 向後相容空值
    assignDate: '', priority: '', difficulty: '', stuckReason: '',
    documentNotes: '', discountRate: null, contractDate: '', plannedDate: '',
    qualityScore: null, progressNoteExtra: '', quarter: '', bonusQuarter: '',
    year: '', bonus25: null, bonus15: null, bonus3: null, difficultyWeight: null,
  }
}

// ── toPayment ────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toPayment(page: any, caseMap: Record<string, string> = {}, caseDetailMap: Record<string, Case_> = {}): Payment_ {
  const caseId = prop(page, '案件')?.relation?.[0]?.id ?? ''
  const cd = caseDetailMap[caseId]
  return {
    id: page.id,
    title: text(page, '收款項目'),
    caseId,
    caseName: caseMap[caseId] ?? '',
    caseTeam: cd?.team ?? '',
    caseAssignees: cd?.assignees ?? [],
    caseContractAmount: cd?.contractAmount ?? null,
    period: sel(page, '期別'),
    amount: num(page, '應收金額'),
    year: num(page, '請款年度'),
    quarter: sel(page, '請款季別'),
    status: sel(page, '收款狀態'),
    receiptNo: text(page, '收據編號'),
    invoiceDate: dt(page, '請款日期'),
    receivedDate: dt(page, '實收日期'),
    notes: text(page, '備註'),
  }
}

// ── 查詢 ─────────────────────────────────────────────────────
export async function fetchAllClients(): Promise<Client_[]> {
  const pages: any[] = []
  let cursor: string | undefined
  do {
    const res = await notion.databases.query({
      database_id: DB_IDS.clients, start_cursor: cursor, page_size: 100,
      sorts: [{ property: '委託單位名稱', direction: 'ascending' }],
    })
    pages.push(...res.results)
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined
  } while (cursor)
  return pages.map(toClient)
}

export async function fetchAllCases(): Promise<Case_[]> {
  const clients = await fetchAllClients()
  const clientMap: Record<string, string> = {}
  clients.forEach(c => { clientMap[c.id] = c.name })
  const pages: any[] = []
  let cursor: string | undefined
  do {
    const res = await notion.databases.query({
      database_id: DB_IDS.cases, start_cursor: cursor, page_size: 100,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    })
    pages.push(...res.results)
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined
  } while (cursor)
  return pages.map(p => {
    const c = toCase(p)
    if (c.clientId && !c.clientName) c.clientName = clientMap[c.clientId] ?? ''
    return c
  })
}

export async function fetchAllPayments(): Promise<Payment_[]> {
  const casePages: any[] = []
  let cursor: string | undefined
  do {
    const res = await notion.databases.query({ database_id: DB_IDS.cases, start_cursor: cursor, page_size: 100 })
    casePages.push(...res.results)
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined
  } while (cursor)
  const caseMap: Record<string, string> = {}
  const caseDetailMap: Record<string, Case_> = {}
  casePages.forEach(p => { const c = toCase(p); caseMap[p.id] = c.name; caseDetailMap[p.id] = c })
  const pages: any[] = []
  cursor = undefined
  do {
    const res = await notion.databases.query({
      database_id: DB_IDS.payments, start_cursor: cursor, page_size: 100,
      sorts: [{ property: '期別', direction: 'ascending' }],
    })
    pages.push(...res.results)
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined
  } while (cursor)
  return pages.map(p => toPayment(p, caseMap, caseDetailMap))
}

// ── CRUD Client ───────────────────────────────────────────────
export async function createClient(data: Partial<Client_>) {
  const props: any = {
    '委託單位名稱': { title: rt(data.name ?? '') },
    '統一編號': { rich_text: rt(data.taxId ?? '') },
    '公司地址': { rich_text: rt(data.address ?? '') },
    '聯絡窗口1_姓名': { rich_text: rt(data.contact1Name ?? '') },
    '聯絡窗口2_姓名': { rich_text: rt(data.contact2Name ?? '') },
    '端午送禮': { checkbox: data.giftDragonBoat ?? false },
    '中秋送禮': { checkbox: data.giftMidAutumn ?? false },
    '春節送禮': { checkbox: data.giftNewYear ?? false },
    '年節送禮': { checkbox: data.giftYearEnd ?? false },
    '備註': { rich_text: rt(data.notes ?? '') },
  }
  if (data.phone)         props['公司電話'] = { phone_number: data.phone }
  if (data.fax)           props['傳真'] = { phone_number: data.fax }
  if (data.contact1Phone) props['聯絡窗口1_電話'] = { phone_number: data.contact1Phone }
  if (data.contact1Email) props['聯絡窗口1_Email'] = { email: data.contact1Email }
  if (data.contact2Phone) props['聯絡窗口2_電話'] = { phone_number: data.contact2Phone }
  if (data.contact2Email) props['聯絡窗口2_Email'] = { email: data.contact2Email }
  if (data.contact3Name)  props['聯絡窗口3_姓名'] = { rich_text: rt(data.contact3Name) }
  if (data.contact3Phone) props['聯絡窗口3_電話'] = { phone_number: data.contact3Phone }
  if (data.contact3Email) props['聯絡窗口3_Email'] = { email: data.contact3Email }
  if (data.contact4Name)  props['聯絡窗口4_姓名'] = { rich_text: rt(data.contact4Name) }
  if (data.contact4Phone) props['聯絡窗口4_電話'] = { phone_number: data.contact4Phone }
  if (data.contact4Email) props['聯絡窗口4_Email'] = { email: data.contact4Email }
  if (data.clientType)    props['客戶類型'] = { select: { name: data.clientType } }
  return notion.pages.create({ parent: { database_id: DB_IDS.clients }, properties: props })
}

export async function updateClient(id: string, data: Partial<Client_>) {
  const props: any = {}
  if (data.name !== undefined)          props['委託單位名稱'] = { title: rt(data.name) }
  if (data.taxId !== undefined)         props['統一編號'] = { rich_text: rt(data.taxId) }
  if (data.phone !== undefined)         props['公司電話'] = data.phone ? { phone_number: data.phone } : null
  if (data.fax !== undefined)           props['傳真'] = data.fax ? { phone_number: data.fax } : null
  if (data.address !== undefined)       props['公司地址'] = { rich_text: rt(data.address) }
  if (data.contact1Name !== undefined)  props['聯絡窗口1_姓名'] = { rich_text: rt(data.contact1Name) }
  if (data.contact1Phone !== undefined) props['聯絡窗口1_電話'] = data.contact1Phone ? { phone_number: data.contact1Phone } : null
  if (data.contact1Email !== undefined) props['聯絡窗口1_Email'] = data.contact1Email ? { email: data.contact1Email } : null
  if (data.contact2Name !== undefined)  props['聯絡窗口2_姓名'] = { rich_text: rt(data.contact2Name) }
  if (data.contact2Phone !== undefined) props['聯絡窗口2_電話'] = data.contact2Phone ? { phone_number: data.contact2Phone } : null
  if (data.contact2Email !== undefined) props['聯絡窗口2_Email'] = data.contact2Email ? { email: data.contact2Email } : null
  if (data.contact3Name !== undefined)  props['聯絡窗口3_姓名'] = { rich_text: rt(data.contact3Name) }
  if (data.contact3Phone !== undefined) props['聯絡窗口3_電話'] = data.contact3Phone ? { phone_number: data.contact3Phone } : null
  if (data.contact3Email !== undefined) props['聯絡窗口3_Email'] = data.contact3Email ? { email: data.contact3Email } : null
  if (data.contact4Name !== undefined)  props['聯絡窗口4_姓名'] = { rich_text: rt(data.contact4Name) }
  if (data.contact4Phone !== undefined) props['聯絡窗口4_電話'] = data.contact4Phone ? { phone_number: data.contact4Phone } : null
  if (data.contact4Email !== undefined) props['聯絡窗口4_Email'] = data.contact4Email ? { email: data.contact4Email } : null
  if (data.giftDragonBoat !== undefined) props['端午送禮'] = { checkbox: data.giftDragonBoat }
  if (data.giftMidAutumn !== undefined)  props['中秋送禮'] = { checkbox: data.giftMidAutumn }
  if (data.giftNewYear !== undefined)    props['春節送禮'] = { checkbox: data.giftNewYear }
  if (data.giftYearEnd !== undefined)    props['年節送禮'] = { checkbox: data.giftYearEnd }
  if (data.clientType !== undefined) props['客戶類型'] = { select: data.clientType ? { name: data.clientType } : null }
  if (data.notes !== undefined)      props['備註'] = { rich_text: rt(data.notes) }
  return notion.pages.update({ page_id: id, properties: props })
}

// ── CRUD Case ─────────────────────────────────────────────────
export async function createCase(data: Partial<Case_>) {
  const props: any = {
    '案件編號': { title: rt(data.caseNumber ?? data.name ?? '') },
  }
  if (data.name)               props['案件簡稱'] = { rich_text: rt(data.name) }
  if (data.clientId)           props['委託單位'] = { relation: [{ id: data.clientId }] }
  if (data.caseType)           props['估價目的'] = { rich_text: rt(data.caseType) }
  if (data.address)            props['標的物地址'] = { rich_text: rt(data.address) }
  if (data.contractAmountText) props['案件金額'] = { rich_text: rt(data.contractAmountText) }
  if (data.team)               props['組別'] = { select: { name: data.team } }
  if (data.assignees?.length)  props['承辦人'] = { select: { name: data.assignees[0] } }
  if (data.appraisers?.length) props['簽證(負責)估價師'] = { multi_select: data.appraisers.map(n => ({ name: n })) }
  if (data.isActive !== undefined) props['是否進行中'] = { checkbox: data.isActive }
  if (data.isClosed !== undefined) props['是否已結案'] = { checkbox: data.isClosed }
  if (data.dueDate)            props['出件期限'] = { date: { start: data.dueDate } }
  if (data.progressNote)       props['進度'] = { rich_text: rt(data.progressNote) }
  if (data.location)           props['地點'] = { rich_text: rt(data.location) }
  if (data.redFlag !== undefined) props['業務紅燈'] = { checkbox: data.redFlag }
  if (data.redFlagNote)        props['紅燈備註'] = { rich_text: rt(data.redFlagNote) }
  return notion.pages.create({ parent: { database_id: DB_IDS.cases }, properties: props })
}

export async function updateCase(id: string, data: Partial<Case_>) {
  const props: any = {}
  if (data.caseNumber !== undefined)       props['案件編號'] = { title: rt(data.caseNumber) }
  if (data.name !== undefined)             props['案件簡稱'] = { rich_text: rt(data.name) }
  if (data.clientId !== undefined)         props['委託單位'] = { relation: data.clientId ? [{ id: data.clientId }] : [] }
  if (data.caseType !== undefined)         props['估價目的'] = { rich_text: rt(data.caseType) }
  if (data.address !== undefined)          props['標的物地址'] = { rich_text: rt(data.address) }
  if (data.contractAmountText !== undefined) props['案件金額'] = { rich_text: rt(data.contractAmountText) }
  if (data.team !== undefined)             props['組別'] = { select: data.team ? { name: data.team } : null }
  if (data.assignees !== undefined)        props['承辦人'] = { select: data.assignees?.length ? { name: data.assignees[0] } : null }
  if (data.appraisers !== undefined)       props['簽證(負責)估價師'] = { multi_select: data.appraisers.map(n => ({ name: n })) }
  if (data.isActive !== undefined)         props['是否進行中'] = { checkbox: data.isActive }
  if (data.isClosed !== undefined)         props['是否已結案'] = { checkbox: data.isClosed }
  if (data.dueDate !== undefined)          props['出件期限'] = { date: data.dueDate ? { start: data.dueDate } : null }
  if (data.progressNote !== undefined)     props['進度'] = { rich_text: rt(data.progressNote) }
  if (data.location !== undefined)         props['地點'] = { rich_text: rt(data.location) }
  if (data.redFlag !== undefined)          props['業務紅燈'] = { checkbox: data.redFlag }
  if (data.redFlagNote !== undefined)      props['紅燈備註'] = { rich_text: rt(data.redFlagNote) }
  return notion.pages.update({ page_id: id, properties: props })
}

// ── CRUD Payment ──────────────────────────────────────────────
export async function createPayment(data: Partial<Payment_>) {
  const props: any = { '收款項目': { title: rt(data.title ?? '') } }
  if (data.caseId)               props['案件'] = { relation: [{ id: data.caseId }] }
  if (data.period)               props['期別'] = { select: { name: data.period } }
  if (data.amount !== undefined) props['應收金額'] = { number: data.amount }
  if (data.year !== undefined)   props['請款年度'] = { number: data.year }
  if (data.quarter)              props['請款季別'] = { select: { name: data.quarter } }
  if (data.status)               props['收款狀態'] = { select: { name: data.status } }
  if (data.receiptNo)            props['收據編號'] = { rich_text: rt(data.receiptNo) }
  if (data.invoiceDate)          props['請款日期'] = { date: { start: data.invoiceDate } }
  if (data.receivedDate)         props['實收日期'] = { date: { start: data.receivedDate } }
  if (data.notes)                props['備註'] = { rich_text: rt(data.notes) }
  return notion.pages.create({ parent: { database_id: DB_IDS.payments }, properties: props })
}

export async function updatePayment(id: string, data: Partial<Payment_>) {
  const props: any = {}
  if (data.title !== undefined)        props['收款項目'] = { title: rt(data.title) }
  if (data.caseId !== undefined)       props['案件'] = { relation: data.caseId ? [{ id: data.caseId }] : [] }
  if (data.period !== undefined)       props['期別'] = { select: data.period ? { name: data.period } : null }
  if (data.amount !== undefined)       props['應收金額'] = { number: data.amount }
  if (data.year !== undefined)         props['請款年度'] = { number: data.year }
  if (data.quarter !== undefined)      props['請款季別'] = { select: data.quarter ? { name: data.quarter } : null }
  if (data.status !== undefined)       props['收款狀態'] = { select: data.status ? { name: data.status } : null }
  if (data.receiptNo !== undefined)    props['收據編號'] = { rich_text: rt(data.receiptNo) }
  if (data.invoiceDate !== undefined)  props['請款日期'] = { date: data.invoiceDate ? { start: data.invoiceDate } : null }
  if (data.receivedDate !== undefined) props['實收日期'] = { date: data.receivedDate ? { start: data.receivedDate } : null }
  if (data.notes !== undefined)        props['備註'] = { rich_text: rt(data.notes) }
  return notion.pages.update({ page_id: id, properties: props })
}
