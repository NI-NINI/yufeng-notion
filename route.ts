import { NextRequest, NextResponse } from 'next/server'
import { fetchAllPayments, createPayment, updatePayment } from '@/lib/notion'

export async function GET() {
  try {
    const payments = await fetchAllPayments()
    return NextResponse.json(payments)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // 支援批次建立（案件建立時一次建多筆分期款）
    if (Array.isArray(body)) {
      const results = []
      for (const item of body) {
        const page = await createPayment(item)
        results.push(page)
      }
      return NextResponse.json({ ok: true, count: results.length })
    }

    // 單筆建立
    const page = await createPayment(body)
    return NextResponse.json(page)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...data } = await req.json()
    if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })
    const page = await updatePayment(id, data)
    return NextResponse.json(page)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
