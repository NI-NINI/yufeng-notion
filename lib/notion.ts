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

export interface Contact_ {
  name: string; dept: string; title: string
  phone: string; ext: string; mobile: string
  email: string; birthday: string; notes: string
  giftMidAutumn: boolean; giftYearEnd: boolean; giftCalendar: boolean
}

export interface Client_ {
  id: string
  clientNo: number | null   // 客戶編號 auto_increment
  name: string
  taxId: string
  phone: string
  fax: string
  address: string
  // 聯絡窗口 1–4（展平存 Notion）
  contact1Name: string; contact1Dept: string; contact1Title: string
  contact1Phone: string; contact1Ext: string; contact1Mobile: string
  contact1Email: string; contact1Birthday: string; contact1Notes: string
  contact1GiftMidAutumn: boolean; contact1GiftYearEnd: boolean; contact1GiftCalendar: boolean
  contact2Name: string; contact2Dept: string; contact2Title: string
  contact2Phone: string; contact2Ext: string; contact2Mobile: string
  contact2Email: string; contact2Birthday: string; contact2Notes: string
  contact2GiftMidAutumn: boolean; contact2GiftYearEnd: boolean; contact2GiftCalendar: boolean
  contact3Name: string; contact3Dept: string; contact3Title: string
  contact3Phone: string; contact3Ext: string; contact3Mobile: string
  contact3Email: string; contact3Birthday: string; contact3Notes: string
  contact3GiftMidAutumn: boolean; contact3GiftYearEnd: boolean; contact3GiftCalendar: boolean
  contact4Name: string; contact4Dept: string; contact4Title: string
  contact4Phone: string; contact4Ext: string; contact4Mobile: string
  contact4Email: string; contact4Birthday: string; contact4Notes: string
  contact4GiftMidAutumn: boolean; contact4GiftYearEnd: boolean; contact4GiftCalendar: boolean
  // 公司層級送禮（保留向後相容）
  giftMidAutumn: boolean; giftYearEnd: boolean; giftCalendar: boolean
  clientType: string; notes: string; createdAt: string
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
  const ph  = (i: number, f: string) => prop(page, `聯絡窗口${i}_${f}`)?.phone_number ?? ''
  const em  = (i: number) => prop(page, `聯絡窗口${i}_Email`)?.email ?? ''
  const tx  = (i: number, f: string) => text(page, `聯絡窗口${i}_${f}`)
  const ck  = (i: number, f: string) => checkbox_(page, `聯絡窗口${i}_${f}`)
  return {
    id: page.id,
    clientNo: prop(page, '客戶編號')?.unique_id?.number ?? null,
    name: text(page, '委託單位名稱'),
    taxId: text(page, '統一編號'),
    phone: prop(page, '公司電話')?.phone_number ?? '',
    fax: prop(page, '傳真')?.phone_number ?? '',
    address: text(page, '公司地址'),
    contact1Name: tx(1,'姓名'), contact1Dept: tx(1,'部門'), contact1Title: tx(1,'職稱'),
    contact1Phone: ph(1,'電話'), contact1Ext: tx(1,'分機'), contact1Mobile: ph(1,'手機'),
    contact1Email: em(1), contact1Birthday: tx(1,'生日'), contact1Notes: tx(1,'備註'),
    contact1GiftMidAutumn: ck(1,'中秋送禮'), contact1GiftYearEnd: ck(1,'年節送禮'), contact1GiftCalendar: ck(1,'桌曆年曆'),
    contact2Name: tx(2,'姓名'), contact2Dept: tx(2,'部門'), contact2Title: tx(2,'職稱'),
    contact2Phone: ph(2,'電話'), contact2Ext: tx(2,'分機'), contact2Mobile: ph(2,'手機'),
    contact2Email: em(2), contact2Birthday: tx(2,'生日'), contact2Notes: tx(2,'備註'),
    contact2GiftMidAutumn: ck(2,'中秋送禮'), contact2GiftYearEnd: ck(2,'年節送禮'), contact2GiftCalendar: ck(2,'桌曆年曆'),
    contact3Name: tx(3,'姓名'), contact3Dept: tx(3,'部門'), contact3Title: tx(3,'職稱'),
    contact3Phone: ph(3,'電話'), contact3Ext: tx(3,'分機'), contact3Mobile: ph(3,'手機'),
    contact3Email: em(3), contact3Birthday: tx(3,'生日'), contact3Notes: tx(3,'備註'),
    contact3GiftMidAutumn: ck(3,'中秋送禮'), contact3GiftYearEnd: ck(3,'年節送禮'), contact3GiftCalendar: ck(3,'桌曆年曆'),
    contact4Name: tx(4,'姓名'), contact4Dept: tx(4,'部門'), contact4Title: tx(4,'職稱'),
    contact4Phone: ph(4,'電話'), contact4Ext: tx(4,'分機'), contact4Mobile: ph(4,'手機'),
    contact4Email: em(4), contact4Birthday: tx(4,'生日'), contact4Notes: tx(4,'備註'),
    contact4GiftMidAutumn: ck(4,'中秋送禮'), contact4GiftYearEnd: ck(4,'年節送禮'), contact4GiftCalendar: ck(4,'桌曆年曆'),
    giftMidAutumn: checkbox_(page, '中秋送禮'),
    giftYearEnd: checkbox_(page, '年節送禮'),
    giftCalendar: checkbox_(page, '桌曆年曆'),
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
      sorts: [{ property: '預計交件日', direction: 'ascending' }],
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
    '中秋送禮': { checkbox: data.giftMidAutumn ?? false },
    '年節送禮': { checkbox: data.giftYearEnd ?? false },
    '桌曆年曆': { checkbox: data.giftCalendar ?? false },
    '備註': { rich_text: richText(data.notes ?? '') },
  }
  if (data.phone) props['公司電話'] = { phone_number: data.phone }
  if (data.fax)   props['傳真'] = { phone_number: data.fax }
  if (data.clientType) props['客戶類型'] = { select: { name: data.clientType } }
  for (const i of [1,2,3,4] as const) {
    const n = (f: string) => (data as any)[`contact${i}${f}`]
    if (n('Name'))    props[`聯絡窗口${i}_姓名`]  = { rich_text: richText(n('Name')) }
    if (n('Dept'))    props[`聯絡窗口${i}_部門`]  = { rich_text: richText(n('Dept')) }
    if (n('Title'))   props[`聯絡窗口${i}_職稱`]  = { rich_text: richText(n('Title')) }
    if (n('Phone'))   props[`聯絡窗口${i}_電話`]  = { phone_number: n('Phone') }
    if (n('Ext'))     props[`聯絡窗口${i}_分機`]  = { rich_text: richText(n('Ext')) }
    if (n('Mobile'))  props[`聯絡窗口${i}_手機`]  = { phone_number: n('Mobile') }
    if (n('Email'))   props[`聯絡窗口${i}_Email`] = { email: n('Email') }
    if (n('Birthday')) props[`聯絡窗口${i}_生日`] = { rich_text: richText(n('Birthday')) }
    if (n('Notes'))   props[`聯絡窗口${i}_備註`]  = { rich_text: richText(n('Notes')) }
    props[`聯絡窗口${i}_中秋送禮`] = { checkbox: n('GiftMidAutumn') ?? false }
    props[`聯絡窗口${i}_年節送禮`] = { checkbox: n('GiftYearEnd') ?? false }
    props[`聯絡窗口${i}_桌曆年曆`] = { checkbox: n('GiftCalendar') ?? false }
  }
  return notion.pages.create({ parent: { database_id: DB_IDS.clients }, properties: props })
}

export async function updateClient(id: string, data: Partial<Client_>) {
  const props: any = {}
  if (data.name !== undefined)    props['委託單位名稱'] = { title: richText(data.name) }
  if (data.taxId !== undefined)   props['統一編號'] = { rich_text: richText(data.taxId) }
  if (data.phone !== undefined)   props['公司電話'] = data.phone ? { phone_number: data.phone } : { phone_number: null }
  if (data.fax !== undefined)     props['傳真'] = data.fax ? { phone_number: data.fax } : { phone_number: null }
  if (data.address !== undefined) props['公司地址'] = { rich_text: richText(data.address) }
  if (data.giftMidAutumn !== undefined) props['中秋送禮'] = { checkbox: data.giftMidAutumn }
  if (data.giftYearEnd !== undefined)   props['年節送禮'] = { checkbox: data.giftYearEnd }
  if (data.giftCalendar !== undefined)  props['桌曆年曆'] = { checkbox: data.giftCalendar }
  if (data.clientType !== undefined) props['客戶類型'] = { select: data.clientType ? { name: data.clientType } : null }
  if (data.notes !== undefined)   props['備註'] = { rich_text: richText(data.notes) }
  for (const i of [1,2,3,4] as const) {
    const n = (f: string) => (data as any)[`contact${i}${f}`]
    if (n('Name') !== undefined)    props[`聯絡窗口${i}_姓名`]  = { rich_text: richText(n('Name') ?? '') }
    if (n('Dept') !== undefined)    props[`聯絡窗口${i}_部門`]  = { rich_text: richText(n('Dept') ?? '') }
    if (n('Title') !== undefined)   props[`聯絡窗口${i}_職稱`]  = { rich_text: richText(n('Title') ?? '') }
    if (n('Phone') !== undefined)   props[`聯絡窗口${i}_電話`]  = { phone_number: n('Phone') || null }
    if (n('Ext') !== undefined)     props[`聯絡窗口${i}_分機`]  = { rich_text: richText(n('Ext') ?? '') }
    if (n('Mobile') !== undefined)  props[`聯絡窗口${i}_手機`]  = { phone_number: n('Mobile') || null }
    if (n('Email') !== undefined)   props[`聯絡窗口${i}_Email`] = { email: n('Email') || null }
    if (n('Birthday') !== undefined) props[`聯絡窗口${i}_生日`] = { rich_text: richText(n('Birthday') ?? '') }
    if (n('Notes') !== undefined)   props[`聯絡窗口${i}_備註`]  = { rich_text: richText(n('Notes') ?? '') }
    if (n('GiftMidAutumn') !== undefined) props[`聯絡窗口${i}_中秋送禮`] = { checkbox: n('GiftMidAutumn') }
    if (n('GiftYearEnd') !== undefined)   props[`聯絡窗口${i}_年節送禮`] = { checkbox: n('GiftYearEnd') }
    if (n('GiftCalendar') !== undefined)  props[`聯絡窗口${i}_桌曆年曆`] = { checkbox: n('GiftCalendar') }
  }
  return notion.pages.update({ page_id: id, properties: props })
}

export async function deleteClient(id: string) {
  return notion.pages.update({ page_id: id, archived: true })
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
  if (data.assignees?.length) props['承辦人'] = { multi_select: data.assignees.map(n => ({ name: n })) }
  if (data.appraisers?.length) props['簽證(負責)估價師'] = { multi_select: data.appraisers.map(n => ({ name: n })) }
  if (data.status) props['案件狀態'] = { select: { name: data.status } }
  if (data.priority) props['順位'] = { select: { name: data.priority } }
  if (data.assignDate) props['派件日'] = { date: { start: data.assignDate } }
  if (data.dueDate) { props['預計交件日'] = { date: { start: data.dueDate } }; props['出件期限'] = { date: { start: data.dueDate } } }
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
  if (data.assignees !== undefined) props['承辦人'] = { multi_select: data.assignees.map(n => ({ name: n })) }
  if (data.appraisers !== undefined) props['簽證(負責)估價師'] = { multi_select: data.appraisers.map(n => ({ name: n })) }
  if (data.status !== undefined) props['案件狀態'] = { select: data.status ? { name: data.status } : null }
  if (data.priority !== undefined) props['順位'] = { select: data.priority ? { name: data.priority } : null }
  if (data.assignDate !== undefined) props['派件日'] = { date: data.assignDate ? { start: data.assignDate } : null }
  if (data.dueDate !== undefined) {
    props['預計交件日'] = { date: data.dueDate ? { start: data.dueDate } : null }
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
