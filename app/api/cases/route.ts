import { NextRequest, NextResponse } from 'next/server'
import { fetchAllCases, createCase, updateCase } from '@/lib/notion'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('clientId')
    let filter: any = undefined
    if (clientId) {
      filter = { filter: { property: '委託單位', relation: { contains: clientId } } }
    }
    const cases = await fetchAllCases(filter)
    return NextResponse.json(cases)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    // 前端 leadingType → Notion '領銜類型' 欄位
    if (data.leadingType && !data.leadingTypeField) {
      data.leadingTypeField = data.leadingType
    }
    // 前端 leadingFee → Notion '領銜費'
    if (data.leadingFee && !data.leadingFeeText) {
      data.leadingFeeText = String(data.leadingFee)
    }
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
