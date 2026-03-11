import { Client } from '@notionhq/client'

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

export const DB_IDS = {
  clients:  process.env.NOTION_CLIENT_DB_ID!,
  cases:    process.env.NOTION_CASE_DB_ID || '76a8c9d4978c821c92e581f1d403babf',
  payments: process.env.NOTION_PAYMENT_DB_ID!,
}

// ── 型別定義 ──────────────────────────────────────────────────

export interface Client_ {
  id: string
  name: string
  taxId: string
  phone: string
  fax: string
  address: string
  contact1Name: string
  contact1Phone: string
  contact1Email: string
  contact2Name: string
  contact2Phone: string
  contact2Email: string
  contact3Name: string
  contact3Phone: string
  contact3Email: string
  contact4Name: string
  contact4Phone: string
  contact4Email: string
  // 四節送禮（對應 Notion 四個 checkbox 欄位）
  giftDragonBoat: boolean
  giftMidAutumn: boolean
  giftNewYear: boolean
  giftYearEnd: boolean
  isGiftTarget: boolean   // 向後相容，只要任一節有勾就為 true
  clientType: string
  notes: string
  createdAt: string
}

export interface Case_ {
  id: string
  name: string
  caseNumber: number | null
  clientId: string
  clientName: string
  caseType: string
  address: string
  contractAmount: number | null
  discountRate: number | null
  contractDate: string
  plannedDate: string
  documentNotes: string
  team: string
  assignees: string[]
  appraisers: string[]
  status: string
  priority: string
  assignDate: string
  dueDate: string
  difficulty: string
  stuckReason: string
  progressNote: string
  qualityScore: number | null
  quarter: string
  bonusQuarter: string
  year: string
  bonus25: number | null
  bonus15: number | null
  bonus3: number | null
  difficultyWeight: number | null
  redFlag: boolean
  redFlagNote: string
  updatedAt: string
}

export interface Payment_ {
  id: string
  title: string
  caseId: string
  caseName: string
  caseTeam: string
  caseAssignees: string[]
  caseContractAmount: number | null
  period: string
  amount: number | null
  year: number | null
  quarter: string
  status: string
  receiptNo: string
  invoiceDate: string
  receivedDate: string
  notes: string
}

// ── helpers ────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function prop(page: any, key: string) { return page.properties?.[key] }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function text(page: any, key: string): string {
  const p = prop(page, key)
  if (!p) return ''
  if (p.type === 'title') return p.title?.map((t: any) => t.plain_text).join('') ?? ''
  if (p.type === 'rich_text') return p.rich_text?.map((t: any) => t.plain_text).join('') ?? ''
  if (p.type === 'phone_number') return p.phone_number ?? ''
  if (p.type === 'email') return p.email ?? ''
  return ''
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function select_(page: any, key: string): string { return prop(page, key)?.select?.name ?? '' }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function multiSelect(page: any, key: string): string[] { return prop(page, key)?.multi_select?.map((o: any) => o.name) ?? [] }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function num(page: any, key: string): number | null { return prop(page, key)?.number ?? null }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function date_(page: any, key: string): string { return prop(page, key)?.date?.start ?? '' }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function checkbox_(page: any, key: string): boolean { return prop(page, key)?.checkbox ?? false }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formula_(page: any, key: string): any {
  const f = prop(page, key)?.formula
  if (!f) return null
  if (f.type === 'number') return f.number
  if (f.type === 'string') return f.string
  return null
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function relation_(page: any, key: string): string[] { return prop(page, key)?.relation?.map((r: any) => r.id) ?? [] }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function uniqueId_(page: any, key: string): number | null { return prop(page, key)?.unique_id?.number ?? null }

// ── 資料轉換 ───────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toClient(page: any): Client_ {
  const giftDragonBoat = checkbox_(page, '端午送禮')
  const giftMidAutumn  = checkbox_(page, '中秋送禮')
  const giftNewYear    = checkbox_(page, '春節送禮')
  const giftYearEnd    = checkbox_(page, '年節送禮')
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
    giftDragonBoat,
    giftMidAutumn,
    giftNewYear,
    giftYearEnd,
    isGiftTarget: checkbox_(page, '送禮對象') || giftDragonBoat || giftMidAutumn || giftNewYear || giftYearEnd,
    clientType: select_(page, '客戶類型'),
    notes: text(page, '備註'),
    createdAt: prop(page, '建立日期')?.created_time ?? '',
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toCase(page: any, clientMap: Record<string, string> = {}): Case_ {
  // 支援兩種 DB：舊系統 (relation委託單位) 和你現有 DB (text委託單位)
  const clientIds = relation_(page, '委託單位')
  const clientId = clientIds[0] ?? ''
  const clientNameText = text(page, '委託單位') // 你現有DB是純文字
  // 案件名稱：你現有DB用「案件簡稱」+「案件編號」(title)
  const name = text(page, '案件簡稱') || text(page, '案件名稱') || text(page, '案件編號') || ''
  // 承辦人：你現有DB是 single select，前端需要陣列
  const assigneeSingle = select_(page, '承辦人')
  const assigneeMulti = multiSelect(page, '承辦人')
  const assignees = assigneeMulti.length ? assigneeMulti : (assigneeSingle ? [assigneeSingle] : [])
  return {
    id: page.id,
    name,
    caseNumber: uniqueId_(page, '案件編號'),
    clientId,
    clientName: clientNameText || clientMap[clientId] || '',
    caseType: select_(page, '估價目的') || select_(page, '案件類型') || '',
    address: text(page, '標的物地址') || text(page, '標的地址'),
    contractAmount: num(page, '簽約金額'),
    discountRate: num(page, '折扣比例'),
    contractDate: date_(page, '簽約日期'),
    plannedDate: date_(page, '預定完成日'),
    documentNotes: text(page, '文件備註'),
    team: select_(page, '負責組別') || select_(page, '組別') || '',
    assignees,
    appraisers: multiSelect(page, '簽證(負責)估價師').length ? multiSelect(page, '簽證(負責)估價師') : multiSelect(page, '簽證估價師'),
    status: select_(page, '案件狀態') || (checkbox_(page,'是否進行中') ? '進行中' : checkbox_(page,'是否已結案') ? '已完成' : '未啟動'),
    priority: select_(page, '順位'),
    assignDate: date_(page, '派件日'),
    dueDate: date_(page, '預計交件日') || date_(page, '出件期限'),
    difficulty: select_(page, '案件難度'),
    stuckReason: text(page, '擱淺原因'),
    progressNote: text(page, '進度備註') || text(page, '進度'),
    qualityScore: num(page, '品質分數'),
    quarter: formula_(page, '季度') ?? '',
    bonusQuarter: formula_(page, '季度') ?? '',
    year: formula_(page, '年度') ?? '',
    bonus25: formula_(page, '個人獎金_2.5%'),
    bonus15: formula_(page, '組控獎金_1.5%'),
    bonus3: formula_(page, '團獎_3%'),
    difficultyWeight: formula_(page, '難度權重'),
    redFlag: checkbox_(page, '業務紅燈'),
    redFlagNote: text(page, '紅燈備註'),
    updatedAt: prop(page, '最後更新')?.last_edited_time ?? '',
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toPayment(page: any, caseMap: Record<string, string> = {}, caseDetailMap: Record<string, Case_> = {}): Payment_ {
  const caseIds = relation_(page, '案件')
  const caseId = caseIds[0] ?? ''
  const cd = caseDetailMap[caseId]
  return {
    id: page.id,
    title: text(page, '收款項目'),
    caseId,
    caseName: caseMap[caseId] ?? '',
    caseTeam: cd?.team ?? '',
    caseAssignees: cd?.assignees ?? [],
    caseContractAmount: cd?.contractAmount ?? null,
    period: select_(page, '期別'),
    amount: num(page, '應收金額'),
    year: num(page, '請款年度'),
    quarter: select_(page, '請款季別'),
    status: select_(page, '收款狀態'),
    receiptNo: text(page, '收據編號'),
    invoiceDate: date_(page, '請款日期'),
    receivedDate: date_(page, '實收日期'),
    notes: text(page, '備註'),
  }
}

// ── 查詢 ───────────────────────────────────────────────────────
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

export async function fetchAllCases(filters?: object): Promise<Case_[]> {
  const clients = await fetchAllClients()
  const clientMap: Record<string, string> = {}
  clients.forEach(c => { clientMap[c.id] = c.name })
  const pages: any[] = []
  let cursor: string | undefined
  do {
    const res = await notion.databases.query({
      database_id: DB_IDS.cases, start_cursor: cursor, page_size: 100,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
      ...(filters ?? {}),
    })
    pages.push(...res.results)
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined
  } while (cursor)
  return pages.map(p => toCase(p, clientMap))
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
  casePages.forEach(p => {
    caseMap[p.id] = text(p, '案件簡稱') || text(p, '案件名稱') || text(p, '案件編號') || ''
    caseDetailMap[p.id] = toCase(p)
  })
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

// ── helpers ────────────────────────────────────────────────────
function richText(s: string) { return [{ text: { content: s } }] }

// ── CRUD Client ────────────────────────────────────────────────
export async function createClient(data: Partial<Client_>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props: any = {
    '委託單位名稱': { title: richText(data.name ?? '') },
    '統一編號': { rich_text: richText(data.taxId ?? '') },
    '公司地址': { rich_text: richText(data.address ?? '') },
    '聯絡窗口1_姓名': { rich_text: richText(data.contact1Name ?? '') },
    '聯絡窗口2_姓名': { rich_text: richText(data.contact2Name ?? '') },
    '端午送禮': { checkbox: data.giftDragonBoat ?? false },
    '中秋送禮': { checkbox: data.giftMidAutumn ?? false },
    '春節送禮': { checkbox: data.giftNewYear ?? false },
    '年節送禮': { checkbox: data.giftYearEnd ?? false },
    '備註': { rich_text: richText(data.notes ?? '') },
  }
  // phone/email: Notion API rejects null values for these types, only set when non-empty
  if (data.phone)         props['公司電話'] = { phone_number: data.phone }
  if (data.fax)           props['傳真'] = { phone_number: data.fax }
  if (data.contact1Phone) props['聯絡窗口1_電話'] = { phone_number: data.contact1Phone }
  if (data.contact1Email) props['聯絡窗口1_Email'] = { email: data.contact1Email }
  if (data.contact2Phone) props['聯絡窗口2_電話'] = { phone_number: data.contact2Phone }
  if (data.contact2Email) props['聯絡窗口2_Email'] = { email: data.contact2Email }
  if (data.contact3Name)  props['聯絡窗口3_姓名'] = { rich_text: richText(data.contact3Name) }
  if (data.contact3Phone) props['聯絡窗口3_電話'] = { phone_number: data.contact3Phone }
  if (data.contact3Email) props['聯絡窗口3_Email'] = { email: data.contact3Email }
  if (data.contact4Name)  props['聯絡窗口4_姓名'] = { rich_text: richText(data.contact4Name) }
  if (data.contact4Phone) props['聯絡窗口4_電話'] = { phone_number: data.contact4Phone }
  if (data.contact4Email) props['聯絡窗口4_Email'] = { email: data.contact4Email }
  if (data.clientType)    props['客戶類型'] = { select: { name: data.clientType } }
  return notion.pages.create({ parent: { database_id: DB_IDS.clients }, properties: props })
}

export async function updateClient(id: string, data: Partial<Client_>) {
  const props: any = {}
  if (data.name !== undefined) props['委託單位名稱'] = { title: richText(data.name) }
  if (data.taxId !== undefined) props['統一編號'] = { rich_text: richText(data.taxId) }
  if (data.phone !== undefined) props['公司電話'] = data.phone ? { phone_number: data.phone } : null
  if (data.fax !== undefined) props['傳真'] = data.fax ? { phone_number: data.fax } : null
  if (data.address !== undefined) props['公司地址'] = { rich_text: richText(data.address) }
  if (data.contact1Name !== undefined) props['聯絡窗口1_姓名'] = { rich_text: richText(data.contact1Name) }
  if (data.contact1Phone !== undefined) props['聯絡窗口1_電話'] = data.contact1Phone ? { phone_number: data.contact1Phone } : null
  if (data.contact1Email !== undefined) props['聯絡窗口1_Email'] = data.contact1Email ? { email: data.contact1Email } : null
  if (data.contact2Name !== undefined) props['聯絡窗口2_姓名'] = { rich_text: richText(data.contact2Name) }
  if (data.contact2Phone !== undefined) props['聯絡窗口2_電話'] = data.contact2Phone ? { phone_number: data.contact2Phone } : null
  if (data.contact3Name !== undefined) props['聯絡窗口3_姓名'] = { rich_text: richText(data.contact3Name) }
  if (data.contact3Phone !== undefined) props['聯絡窗口3_電話'] = data.contact3Phone ? { phone_number: data.contact3Phone } : null
  if (data.contact3Email !== undefined) props['聯絡窗口3_Email'] = data.contact3Email ? { email: data.contact3Email } : null
  if (data.contact4Name !== undefined) props['聯絡窗口4_姓名'] = { rich_text: richText(data.contact4Name) }
  if (data.contact4Phone !== undefined) props['聯絡窗口4_電話'] = data.contact4Phone ? { phone_number: data.contact4Phone } : null
  if (data.contact4Email !== undefined) props['聯絡窗口4_Email'] = data.contact4Email ? { email: data.contact4Email } : null
  if (data.contact2Email !== undefined) props['聯絡窗口2_Email'] = { email: data.contact2Email || null }
  if (data.giftDragonBoat !== undefined) props['端午送禮'] = { checkbox: data.giftDragonBoat }
  if (data.giftMidAutumn !== undefined) props['中秋送禮'] = { checkbox: data.giftMidAutumn }
  if (data.giftNewYear !== undefined) props['春節送禮'] = { checkbox: data.giftNewYear }
  if (data.giftYearEnd !== undefined) props['年節送禮'] = { checkbox: data.giftYearEnd }
  if (data.clientType !== undefined) props['客戶類型'] = { select: data.clientType ? { name: data.clientType } : null }
  if (data.notes !== undefined) props['備註'] = { rich_text: richText(data.notes) }
  return notion.pages.update({ page_id: id, properties: props })
}

// ── CRUD Case ──────────────────────────────────────────────────
export async function createCase(data: Partial<Case_>) {
  // 你現有DB: title="案件編號"(text)，另有「案件簡稱」rich_text
  const props: any = { '案件編號': { title: richText(data.name ?? '') } }
  props['案件簡稱'] = { rich_text: richText(data.name ?? '') }
  if (data.clientId) props['委託單位'] = { relation: [{ id: data.clientId }] }
  if (data.caseType) props['估價目的'] = { select: { name: data.caseType } }
  if (data.address) props['標的物地址'] = { rich_text: richText(data.address) }
  if (data.contractAmount !== undefined) props['簽約金額'] = { number: data.contractAmount }
  if (data.discountRate !== undefined) props['折扣比例'] = { number: data.discountRate }
  if (data.contractDate) props['簽約日期'] = { date: { start: data.contractDate } }
  if (data.plannedDate) props['預定完成日'] = { date: { start: data.plannedDate } }
  if (data.documentNotes) props['文件備註'] = { rich_text: richText(data.documentNotes) }
  if (data.team) props['負責組別'] = { select: { name: data.team } }
  if (data.assignees?.length) props['承辦人'] = { select: { name: data.assignees[0] } }
  if (data.appraisers?.length) props['簽證(負責)估價師'] = { multi_select: data.appraisers.map(n => ({ name: n })) }
  if (data.status) props['案件狀態'] = { select: { name: data.status } }
  if (data.priority) props['順位'] = { select: { name: data.priority } }
  if (data.assignDate) props['date:派件日'] = { date: { start: data.assignDate } }
  if (data.dueDate) { props['date:預計交件日'] = { date: { start: data.dueDate } }; props['出件期限'] = { date: { start: data.dueDate } } }
  if (data.difficulty) props['案件難度'] = { select: { name: data.difficulty } }
  if (data.stuckReason) props['擱淺原因'] = { rich_text: richText(data.stuckReason) }
  if (data.progressNote) { props['進度備註'] = { rich_text: richText(data.progressNote) }; props['進度'] = { rich_text: richText(data.progressNote) } }
  if (data.qualityScore !== undefined) props['品質分數'] = { number: data.qualityScore }
  if (data.redFlag !== undefined) props['業務紅燈'] = { checkbox: data.redFlag }
  if (data.redFlagNote !== undefined) props['紅燈備註'] = { rich_text: richText(data.redFlagNote) }
  return notion.pages.create({ parent: { database_id: DB_IDS.cases }, properties: props })
}

export async function updateCase(id: string, data: Partial<Case_>) {
  const props: any = {}
  if (data.name !== undefined) {
    props['案件編號'] = { title: richText(data.name) }
    props['案件簡稱'] = { rich_text: richText(data.name) }
  }
  if (data.clientId !== undefined) props['委託單位'] = { relation: data.clientId ? [{ id: data.clientId }] : [] }
  if (data.caseType !== undefined) props['估價目的'] = { select: data.caseType ? { name: data.caseType } : null }
  if (data.address !== undefined) props['標的物地址'] = { rich_text: richText(data.address) }
  if (data.contractAmount !== undefined) props['簽約金額'] = { number: data.contractAmount }
  if (data.discountRate !== undefined) props['折扣比例'] = { number: data.discountRate }
  if (data.contractDate !== undefined) props['簽約日期'] = { date: data.contractDate ? { start: data.contractDate } : null }
  if (data.plannedDate !== undefined) props['預定完成日'] = { date: data.plannedDate ? { start: data.plannedDate } : null }
  if (data.documentNotes !== undefined) props['文件備註'] = { rich_text: richText(data.documentNotes) }
  if (data.team !== undefined) props['負責組別'] = { select: data.team ? { name: data.team } : null }
  if (data.assignees !== undefined) props['承辦人'] = { select: data.assignees?.length ? { name: data.assignees[0] } : null }
  if (data.appraisers !== undefined) props['簽證(負責)估價師'] = { multi_select: data.appraisers.map(n => ({ name: n })) }
  if (data.status !== undefined) props['案件狀態'] = { select: data.status ? { name: data.status } : null }
  if (data.priority !== undefined) props['順位'] = { select: data.priority ? { name: data.priority } : null }
  if (data.assignDate !== undefined) props['date:派件日'] = { date: data.assignDate ? { start: data.assignDate } : null }
  if (data.dueDate !== undefined) {
    props['date:預計交件日'] = { date: data.dueDate ? { start: data.dueDate } : null }
    props['出件期限'] = { date: data.dueDate ? { start: data.dueDate } : null }
  }
  if (data.difficulty !== undefined) props['案件難度'] = { select: data.difficulty ? { name: data.difficulty } : null }
  if (data.stuckReason !== undefined) props['擱淺原因'] = { rich_text: richText(data.stuckReason) }
  if (data.progressNote !== undefined) {
    props['進度備註'] = { rich_text: richText(data.progressNote) }
    props['進度'] = { rich_text: richText(data.progressNote) }
  }
  if (data.qualityScore !== undefined) props['品質分數'] = { number: data.qualityScore }
  if (data.redFlag !== undefined) props['業務紅燈'] = { checkbox: data.redFlag }
  if (data.redFlagNote !== undefined) props['紅燈備註'] = { rich_text: richText(data.redFlagNote) }
  return notion.pages.update({ page_id: id, properties: props })
}

// ── CRUD Payment ───────────────────────────────────────────────
export async function createPayment(data: Partial<Payment_>) {
  const props: any = { '收款項目': { title: richText(data.title ?? '') } }
  if (data.caseId) props['案件'] = { relation: [{ id: data.caseId }] }
  if (data.period) props['期別'] = { select: { name: data.period } }
  if (data.amount !== undefined) props['應收金額'] = { number: data.amount }
  if (data.year !== undefined) props['請款年度'] = { number: data.year }
  if (data.quarter) props['請款季別'] = { select: { name: data.quarter } }
  if (data.status) props['收款狀態'] = { select: { name: data.status } }
  if (data.receiptNo) props['收據編號'] = { rich_text: richText(data.receiptNo) }
  if (data.invoiceDate) props['請款日期'] = { date: { start: data.invoiceDate } }
  if (data.receivedDate) props['實收日期'] = { date: { start: data.receivedDate } }
  if (data.notes) props['備註'] = { rich_text: richText(data.notes) }
  return notion.pages.create({ parent: { database_id: DB_IDS.payments }, properties: props })
}

export async function updatePayment(id: string, data: Partial<Payment_>) {
  const props: any = {}
  if (data.title !== undefined) props['收款項目'] = { title: richText(data.title) }
  if (data.caseId !== undefined) props['案件'] = { relation: data.caseId ? [{ id: data.caseId }] : [] }
  if (data.period !== undefined) props['期別'] = { select: data.period ? { name: data.period } : null }
  if (data.amount !== undefined) props['應收金額'] = { number: data.amount }
  if (data.year !== undefined) props['請款年度'] = { number: data.year }
  if (data.quarter !== undefined) props['請款季別'] = { select: data.quarter ? { name: data.quarter } : null }
  if (data.status !== undefined) props['收款狀態'] = { select: data.status ? { name: data.status } : null }
  if (data.receiptNo !== undefined) props['收據編號'] = { rich_text: richText(data.receiptNo) }
  if (data.invoiceDate !== undefined) props['請款日期'] = { date: data.invoiceDate ? { start: data.invoiceDate } : null }
  if (data.receivedDate !== undefined) props['實收日期'] = { date: data.receivedDate ? { start: data.receivedDate } : null }
  if (data.notes !== undefined) props['備註'] = { rich_text: richText(data.notes) }
  return notion.pages.update({ page_id: id, properties: props })
}
