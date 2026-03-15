import { Client } from '@notionhq/client'

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

export const DB_IDS = {
  clients:  process.env.NOTION_CLIENT_DB_ID!,
  cases:    process.env.NOTION_CASE_DB_ID || '9828c9d4978c829488f0818ccd196c81',
  payments: process.env.NOTION_PAYMENT_DB_ID || 'ea37b795aa4a4bf38fc684bcd2fda01f',
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
  importantNote: string
  leadingTypeField: string  // Notion '領銜類型'
  leadingFeeText: string    // Notion '領銜費'
  companyShare: string      // Notion '公司分紅'
  difficultyScore: number | null
  completionScore: number | null
  assignDate2: string      // 交辦日期
  siteVisitDate: string    // 現勘日期
  priceDate: string        // 價格日期
  staffDoneDate: string    // 承辦完成日
  actualDueDate: string    // 實際出件日2
  nextDeadline: string     // 下一交件日
  nextDeadlineNote: string // 交件備註
  deliveryInfo: string     // 繳交資訊摘要
  // 繳交勾選欄
  zhCount: boolean; zhCountDate: string
  zhAbstract: boolean; zhAbstractDate: string
  zhReport: boolean; zhReportDate: string
  zhPresentation: boolean; zhPresentationDate: string
  zhDigital: boolean; zhDigitalDate: string
  zhCD: boolean; zhCDDate: string
  zhNoSealAbstract: boolean; zhNoSealAbstractDate: string
  enCount: boolean; enCountDate: string
  enAbstract: boolean; enAbstractDate: string
  enReport: boolean; enReportDate: string
  enDigital: boolean; enDigitalDate: string
  enCD: boolean; enCDDate: string
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
  amount: number | null       // 請款金額
  ratePct: number | null      // 請款比例%
  receivedAmount: number | null // 實收金額
  status: string
  receiptNo: string
  invoiceDate: string
  receivedDate: string
  notes: string
  payStatus: string   // 付款狀態 (請款中/請款中列獎金/已收款)
  receiptNoteText: string
  extraBonusAmt: number | null
  extraBonusTarget: string
  canInvoice: boolean
  bonusQuarterSel: string
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
    status: select_(page, '案件狀態') || (checkbox_(page,'是否進行中') ? '進行中' : checkbox_(page,'是否已結案') ? '已完成' : '未開始'),
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
    importantNote: text(page, '重要提醒'),
    leadingTypeField: select_(page, '領銜類型'),
    leadingFeeText: text(page, '領銜費'),
    companyShare: text(page, '公司分紅'),
    difficultyScore: num(page, '案件難度'),
    completionScore: num(page, '案件完成度'),
    assignDate2: date_(page, '交辦日期'),
    siteVisitDate: date_(page, '現勘日期'),
    priceDate: date_(page, '價格日期'),
    staffDoneDate: date_(page, '承辦完成日'),
    actualDueDate: date_(page, '實際出件日2'),
    nextDeadline: date_(page, '下一交件日'),
    nextDeadlineNote: text(page, '交件備註'),
    deliveryInfo: text(page, '繳交資訊'),
    zhCount: checkbox_(page, '中文數字'), zhCountDate: date_(page, '中文數字日期'),
    zhAbstract: checkbox_(page, '中文摘要'), zhAbstractDate: date_(page, '中文摘要日期'),
    zhReport: checkbox_(page, '中文報告書'), zhReportDate: date_(page, '中文報告書日期'),
    zhPresentation: checkbox_(page, '中文簡報'), zhPresentationDate: date_(page, '中文簡報日期'),
    zhDigital: checkbox_(page, '中文電子檔'), zhDigitalDate: date_(page, '中文電子檔日期'),
    zhCD: checkbox_(page, '中文光碟'), zhCDDate: date_(page, '中文光碟日期'),
    zhNoSealAbstract: checkbox_(page, '中文免簽摘要'), zhNoSealAbstractDate: date_(page, '中文免簽摘要日期'),
    enCount: checkbox_(page, '英文數字'), enCountDate: date_(page, '英文數字日期'),
    enAbstract: checkbox_(page, '英文摘要'), enAbstractDate: date_(page, '英文摘要日期'),
    enReport: checkbox_(page, '英文報告書'), enReportDate: date_(page, '英文報告書日期'),
    enDigital: checkbox_(page, '英文電子檔'), enDigitalDate: date_(page, '英文電子檔日期'),
    enCD: checkbox_(page, '英文光碟'), enCDDate: date_(page, '英文光碟日期'),
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
    amount: num(page, '請款金額'),
    ratePct: num(page, '請款比例'),
    receivedAmount: num(page, '實收金額'),
    status: select_(page, '收款狀態'),
    receiptNo: text(page, '收據號碼'),
    invoiceDate: date_(page, '請款日期'),
    receivedDate: date_(page, '收款日期'),
    notes: text(page, '備註'),
    payStatus: select_(page, '付款狀態'),
    receiptNoteText: text(page, '收據備註'),
    extraBonusAmt: num(page, '加碼獎金金額'),
    extraBonusTarget: text(page, '加碼獎金對象'),
    canInvoice: checkbox_(page, '可請款'),
    bonusQuarterSel: select_(page, '獎金配發季度'),
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
      sorts: [{ property: '出件期限', direction: 'ascending' }],
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
  if (data.team) props['組別'] = { select: { name: data.team } }
  if (data.assignees?.length) props['承辦人'] = { multi_select: data.assignees.map(n => ({ name: n })) }
  if (data.appraisers?.length) props['簽證(負責)估價師'] = { multi_select: data.appraisers.map(n => ({ name: n })) }
  if (data.status) props['案件狀態'] = { select: { name: data.status } }
  if (data.priority) props['順位'] = { select: { name: data.priority } }
  if (data.assignDate) props['完成期限'] = { date: { start: data.assignDate } }
  if (data.dueDate) props['出件期限'] = { date: { start: data.dueDate } }
  if (data.contractAmount) props['服務費用'] = { rich_text: richText(String(data.contractAmount)) }
  if (data.leadingTypeField) props['領銜類型'] = { select: { name: data.leadingTypeField } }
  if (data.leadingFeeText) props['領銜費'] = { rich_text: richText(data.leadingFeeText) }
  if (data.companyShare) props['公司分紅'] = { rich_text: richText(data.companyShare) }
  if (data.importantNote) props['重要提醒'] = { rich_text: richText(data.importantNote) }
  if (data.difficultyScore !== undefined && data.difficultyScore !== null) props['案件難度'] = { number: data.difficultyScore }
  if (data.completionScore !== undefined && data.completionScore !== null) props['案件完成度'] = { number: data.completionScore }
  if (data.progressNote) props['進度'] = { rich_text: richText(data.progressNote) }
  if (data.redFlagNote !== undefined) props['紅燈備註'] = { rich_text: richText(data.redFlagNote ?? '') }
  if (data.assignDate2) props['交辦日期'] = { date: { start: data.assignDate2 } }
  if (data.siteVisitDate) props['現勘日期'] = { date: { start: data.siteVisitDate } }
  if (data.priceDate) props['價格日期'] = { date: { start: data.priceDate } }
  if (data.staffDoneDate) props['承辦完成日'] = { date: { start: data.staffDoneDate } }
  if (data.actualDueDate) props['實際出件日2'] = { date: { start: data.actualDueDate } }
  if (data.nextDeadline) props['下一交件日'] = { date: { start: data.nextDeadline } }
  if (data.deliveryInfo) props['繳交資訊'] = { rich_text: richText(data.deliveryInfo) }
  if (data.zhCount) props['中文數字'] = { checkbox: data.zhCount }
  if (data.zhCountDate) props['中文數字日期'] = { date: { start: data.zhCountDate } }
  if (data.zhAbstract) props['中文摘要'] = { checkbox: data.zhAbstract }
  if (data.zhAbstractDate) props['中文摘要日期'] = { date: { start: data.zhAbstractDate } }
  if (data.zhReport) props['中文報告書'] = { checkbox: data.zhReport }
  if (data.zhReportDate) props['中文報告書日期'] = { date: { start: data.zhReportDate } }
  if (data.zhPresentation) props['中文簡報'] = { checkbox: data.zhPresentation }
  if (data.zhPresentationDate) props['中文簡報日期'] = { date: { start: data.zhPresentationDate } }
  if (data.zhDigital) props['中文電子檔'] = { checkbox: data.zhDigital }
  if (data.zhDigitalDate) props['中文電子檔日期'] = { date: { start: data.zhDigitalDate } }
  if (data.zhCD) props['中文光碟'] = { checkbox: data.zhCD }
  if (data.zhCDDate) props['中文光碟日期'] = { date: { start: data.zhCDDate } }
  if (data.zhNoSealAbstract) props['中文免簽摘要'] = { checkbox: data.zhNoSealAbstract }
  if (data.zhNoSealAbstractDate) props['中文免簽摘要日期'] = { date: { start: data.zhNoSealAbstractDate } }
  if (data.enCount) props['英文數字'] = { checkbox: data.enCount }
  if (data.enCountDate) props['英文數字日期'] = { date: { start: data.enCountDate } }
  if (data.enAbstract) props['英文摘要'] = { checkbox: data.enAbstract }
  if (data.enAbstractDate) props['英文摘要日期'] = { date: { start: data.enAbstractDate } }
  if (data.enReport) props['英文報告書'] = { checkbox: data.enReport }
  if (data.enReportDate) props['英文報告書日期'] = { date: { start: data.enReportDate } }
  if (data.enDigital) props['英文電子檔'] = { checkbox: data.enDigital }
  if (data.enDigitalDate) props['英文電子檔日期'] = { date: { start: data.enDigitalDate } }
  if (data.enCD) props['英文光碟'] = { checkbox: data.enCD }
  if (data.enCDDate) props['英文光碟日期'] = { date: { start: data.enCDDate } }
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
  if (data.contractAmount !== undefined) props['服務費用'] = { rich_text: richText(String(data.contractAmount ?? '')) }
  if (data.importantNote !== undefined) props['重要提醒'] = { rich_text: richText(data.importantNote ?? '') }
  if (data.difficultyScore !== undefined) props['案件難度'] = { number: data.difficultyScore }
  if (data.completionScore !== undefined) props['案件完成度'] = { number: data.completionScore }
  if (data.team !== undefined) props['組別'] = { select: data.team ? { name: data.team } : null }
  if (data.assignees !== undefined) props['承辦人'] = { multi_select: data.assignees.map(n => ({ name: n })) }
  if (data.appraisers !== undefined) props['簽證(負責)估價師'] = { multi_select: data.appraisers.map(n => ({ name: n })) }
  if (data.status !== undefined) props['案件狀態'] = { select: data.status ? { name: data.status } : null }
  if (data.priority !== undefined) props['順位'] = { select: data.priority ? { name: data.priority } : null }
  if (data.assignDate !== undefined) props['完成期限'] = { date: data.assignDate ? { start: data.assignDate } : null }
  if (data.dueDate !== undefined) {
    props['出件期限'] = { date: data.dueDate ? { start: data.dueDate } : null }
  }
  if (data.progressNote !== undefined) props['進度'] = { rich_text: richText(data.progressNote) }
  if (data.redFlagNote !== undefined) props['紅燈備註'] = { rich_text: richText(data.redFlagNote ?? '') }
  if (data.importantNote !== undefined) props['重要提醒'] = { rich_text: richText(data.importantNote ?? '') }
  if (data.leadingTypeField !== undefined) props['領銜類型'] = { select: data.leadingTypeField ? { name: data.leadingTypeField } : null }
  if (data.leadingFeeText !== undefined) props['領銜費'] = { rich_text: richText(data.leadingFeeText ?? '') }
  if (data.companyShare !== undefined) props['公司分紅'] = { rich_text: richText(data.companyShare ?? '') }
  // 日期欄位（前端 siteVisitDate, priceDate, staffDoneDate, actualDueDate 沒有對應 Notion 欄位，寫入進度備註）
  // nextDeadline → 完成期限（承辦下一階段交件日，複用此欄位）
  if (data.assignDate2 !== undefined) props['交辦日期'] = { date: data.assignDate2 ? { start: data.assignDate2 } : null }
  if (data.siteVisitDate !== undefined) props['現勘日期'] = { date: data.siteVisitDate ? { start: data.siteVisitDate } : null }
  if (data.priceDate !== undefined) props['價格日期'] = { date: data.priceDate ? { start: data.priceDate } : null }
  if (data.staffDoneDate !== undefined) props['承辦完成日'] = { date: data.staffDoneDate ? { start: data.staffDoneDate } : null }
  if (data.actualDueDate !== undefined) props['實際出件日2'] = { date: data.actualDueDate ? { start: data.actualDueDate } : null }
  if (data.nextDeadline !== undefined) props['下一交件日'] = { date: data.nextDeadline ? { start: data.nextDeadline } : null }
  if (data.nextDeadlineNote !== undefined) props['交件備註'] = { rich_text: richText(data.nextDeadlineNote ?? '') }
  if (data.deliveryInfo !== undefined) props['繳交資訊'] = { rich_text: richText(data.deliveryInfo ?? '') }
  // 繳交勾選
  const ck = (v: boolean | undefined, n: string) => { if (v !== undefined) props[n] = { checkbox: v } }
  const dt = (v: string | undefined, n: string) => { if (v !== undefined) props[n] = { date: v ? { start: v } : null } }
  ck(data.zhCount, '中文數字'); dt(data.zhCountDate, '中文數字日期')
  ck(data.zhAbstract, '中文摘要'); dt(data.zhAbstractDate, '中文摘要日期')
  ck(data.zhReport, '中文報告書'); dt(data.zhReportDate, '中文報告書日期')
  ck(data.zhPresentation, '中文簡報'); dt(data.zhPresentationDate, '中文簡報日期')
  ck(data.zhDigital, '中文電子檔'); dt(data.zhDigitalDate, '中文電子檔日期')
  ck(data.zhCD, '中文光碟'); dt(data.zhCDDate, '中文光碟日期')
  ck(data.zhNoSealAbstract, '中文免簽摘要'); dt(data.zhNoSealAbstractDate, '中文免簽摘要日期')
  ck(data.enCount, '英文數字'); dt(data.enCountDate, '英文數字日期')
  ck(data.enAbstract, '英文摘要'); dt(data.enAbstractDate, '英文摘要日期')
  ck(data.enReport, '英文報告書'); dt(data.enReportDate, '英文報告書日期')
  ck(data.enDigital, '英文電子檔'); dt(data.enDigitalDate, '英文電子檔日期')
  ck(data.enCD, '英文光碟'); dt(data.enCDDate, '英文光碟日期')
  return notion.pages.update({ page_id: id, properties: props })
}

// ── CRUD Payment ───────────────────────────────────────────────
export async function createPayment(data: Partial<Payment_>) {
  const props: any = { '收款項目': { title: richText(data.title ?? '') } }
  if (data.caseId) props['案件'] = { relation: [{ id: data.caseId }] }
  if (data.period) props['期別'] = { select: { name: data.period } }
  if (data.amount !== undefined) props['請款金額'] = { number: data.amount }
  if (data.ratePct !== undefined) props['請款比例'] = { number: data.ratePct }
  if (data.receivedAmount !== undefined) props['實收金額'] = { number: data.receivedAmount }
  if (data.status) props['收款狀態'] = { select: { name: data.status } }
  if (data.receiptNo) props['收據號碼'] = { rich_text: richText(data.receiptNo) }
  if (data.invoiceDate) props['請款日期'] = { date: { start: data.invoiceDate } }
  if (data.receivedDate) props['收款日期'] = { date: { start: data.receivedDate } }
  if (data.notes) props['備註'] = { rich_text: richText(data.notes) }
  return notion.pages.create({ parent: { database_id: DB_IDS.payments }, properties: props })
}

export async function updatePayment(id: string, data: Partial<Payment_>) {
  const props: any = {}
  if (data.title !== undefined) props['收款項目'] = { title: richText(data.title) }
  if (data.caseId !== undefined) props['案件'] = { relation: data.caseId ? [{ id: data.caseId }] : [] }
  if (data.period !== undefined) props['期別'] = { select: data.period ? { name: data.period } : null }
  if (data.amount !== undefined) props['請款金額'] = { number: data.amount }
  if (data.ratePct !== undefined) props['請款比例'] = { number: data.ratePct }
  if (data.receivedAmount !== undefined) props['實收金額'] = { number: data.receivedAmount }
  if (data.status !== undefined) props['收款狀態'] = { select: data.status ? { name: data.status } : null }
  if (data.receiptNo !== undefined) props['收據號碼'] = { rich_text: richText(data.receiptNo) }
  if (data.invoiceDate !== undefined) props['請款日期'] = { date: data.invoiceDate ? { start: data.invoiceDate } : null }
  if (data.receivedDate !== undefined) props['收款日期'] = { date: data.receivedDate ? { start: data.receivedDate } : null }
  if (data.notes !== undefined) props['備註'] = { rich_text: richText(data.notes) }
  if (data.payStatus !== undefined) props['付款狀態'] = { select: data.payStatus ? { name: data.payStatus } : null }
  if (data.receiptNoteText !== undefined) props['收據備註'] = { rich_text: richText(data.receiptNoteText ?? '') }
  if (data.extraBonusAmt !== undefined) props['加碼獎金金額'] = { number: data.extraBonusAmt }
  if (data.extraBonusTarget !== undefined) props['加碼獎金對象'] = { rich_text: richText(data.extraBonusTarget ?? '') }
  if ((data as any).canInvoice !== undefined) props['可請款'] = { checkbox: (data as any).canInvoice }
  if ((data as any).bonusQuarterSel !== undefined) props['獎金配發季度'] = { select: (data as any).bonusQuarterSel ? { name: (data as any).bonusQuarterSel } : null }
  return notion.pages.update({ page_id: id, properties: props })
}
