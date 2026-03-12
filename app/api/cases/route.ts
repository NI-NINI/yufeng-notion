import { NextRequest, NextResponse } from 'next/server'
import { fetchAllCases, createCase, updateCase } from '@/lib/notion'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('clientId')
    let cases = await fetchAllCases()
    // 若有 clientId 參數，篩選對應案件（relation 欄位）
    if (clientId) {
      cases = cases.filter(c => c.clientId === clientId)
    }
    return NextResponse.json(cases)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const page = await createCase(data)
    return NextResponse.json(page)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...data } = await req.json()
    const page = await updateCase(id, data)
    return NextResponse.json(page)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
