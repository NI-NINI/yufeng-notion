import { Client } from '@notionhq/client';

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export const CASE_DB_ID = process.env.NOTION_CASE_DB_ID!;
export const CLIENT_DB_ID = process.env.NOTION_CLIENT_DB_ID!;

export async function getCases(filter?: { status?: string; team?: string }) {
  const filters: any[] = [];
  if (filter?.status) filters.push({ property: '狀態', select: { equals: filter.status } });
  if (filter?.team) filters.push({ property: '負責團隊', select: { equals: filter.team } });
  const params: any = { database_id: CASE_DB_ID, sorts: [{ property: '截止日期', direction: 'ascending' }], page_size: 100 };
  if (filters.length > 0) params.filter = filters.length === 1 ? filters[0] : { and: filters };
  const resp = await notion.databases.query(params);
  return resp.results.map(mapCase);
}

export async function getCase(id: string) {
  const page = await notion.pages.retrieve({ page_id: id }) as any;
  return mapCase(page);
}

export async function createCase(data: any) {
  return await notion.pages.create({ parent: { database_id: CASE_DB_ID }, properties: buildCaseProperties(data) });
}

export async function updateCase(id: string, data: any) {
  return await notion.pages.update({ page_id: id, properties: buildCaseProperties(data) });
}

export async function getClients() {
  const resp = await notion.databases.query({ database_id: CLIENT_DB_ID, sorts: [{ property: '客戶名稱', direction: 'ascending' }], page_size: 100 });
  return resp.results.map(mapClient);
}

export async function createClient(data: any) {
  return await notion.pages.create({ parent: { database_id: CLIENT_DB_ID }, properties: {
    '客戶名稱': { title: [{ text: { content: data.name || '' } }] },
    '聯絡人': { rich_text: [{ text: { content: data.contact || '' } }] },
    '電話': { phone_number: data.phone || null },
    'Email': { email: data.email || null },
    '地址': { rich_text: [{ text: { content: data.address || '' } }] },
    '統一編號': { rich_text: [{ text: { content: data.taxId || '' } }] },
    '備註': { rich_text: [{ text: { content: data.note || '' } }] },
  }});
}

function mapCase(page: any) {
  const p = page.properties;
  return { id: page.id, name: p['案件名稱']?.title?.[0]?.plain_text || '', code: p['案件編號']?.rich_text?.[0]?.plain_text || '', clientName: p['客戶名稱']?.rich_text?.[0]?.plain_text || '', type: p['案件類型']?.select?.name || '', address: p['地址']?.rich_text?.[0]?.plain_text || '', team: p['負責團隊']?.select?.name || '', appraiser: p['負責估價師']?.rich_text?.[0]?.plain_text || '', status: p['狀態']?.select?.name || '', priority: p['優先順序']?.select?.name || '', contractAmount: p['合約金額']?.number || 0, discountPct: p['折扣%']?.number || 0, assignDate: p['指派日期']?.date?.start || '', dueDate: p['截止日期']?.date?.start || '', nextDue: p['下次追蹤']?.date?.start || '', note: p['備註']?.rich_text?.[0]?.plain_text || '', createdAt: page.created_time, updatedAt: page.last_edited_time };
}

function mapClient(page: any) {
  const p = page.properties;
  return { id: page.id, name: p['客戶名稱']?.title?.[0]?.plain_text || '', contact: p['聯絡人']?.rich_text?.[0]?.plain_text || '', phone: p['電話']?.phone_number || '', email: p['Email']?.email || '', address: p['地址']?.rich_text?.[0]?.plain_text || '', taxId: p['統一編號']?.rich_text?.[0]?.plain_text || '', note: p['備註']?.rich_text?.[0]?.plain_text || '' };
}

function buildCaseProperties(data: any) {
  const props: any = { '案件名稱': { title: [{ text: { content: data.name || '' } }] }, '案件編號': { rich_text: [{ text: { content: data.code || '' } }] }, '客戶名稱': { rich_text: [{ text: { content: data.clientName || '' } }] }, '地址': { rich_text: [{ text: { content: data.address || '' } }] }, '負責估價師': { rich_text: [{ text: { content: data.appraiser || '' } }] }, '備註': { rich_text: [{ text: { content: data.note || '' } }] } };
  if (data.type) props['案件類型'] = { select: { name: data.type } };
  if (data.team) props['負責團隊'] = { select: { name: data.team } };
  if (data.status) props['狀態'] = { select: { name: data.status } };
  if (data.priority) props['優先順序'] = { select: { name: data.priority } };
  if (data.contractAmount !== undefined) props['合約金額'] = { number: Number(data.contractAmount) || 0 };
  if (data.discountPct !== undefined) props['折扣%'] = { number: Number(data.discountPct) || 0 };
  if (data.assignDate) props['指派日期'] = { date: { start: data.assignDate } };
  if (data.dueDate) props['截止日期'] = { date: { start: data.dueDate } };
  if (data.nextDue) props['下次追蹤'] = { date: { start: data.nextDue } };
  return props;
}
