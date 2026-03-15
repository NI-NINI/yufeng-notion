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
    console.log('[payments POST] 收到請求:', JSON.stringify(body).substring(0, 500))

    // 支援批次建立（案件建立時一次建多筆分期款）
    if (Array.isArray(body)) {
      const results = []
      for (let i = 0; i < body.length; i++) {
        console.log(`[payments POST] 建立第 ${i + 1}/${body.length} 筆:`, body[i].title)
        const page = await createPayment(body[i])
        console.log(`[payments POST] 第 ${i + 1} 筆成功, id:`, page.id)
        results.push(page)
      }
      return NextResponse.json({ ok: true, count: results.length, ids: results.map(r => r.id) })
    }

    // 單筆建立
    console.log('[payments POST] 單筆建立:', body.title)
    const page = await createPayment(body)
    console.log('[payments POST] 成功, id:', page.id)
    return NextResponse.json(page)
  } catch (e: any) {
    console.error('[payments POST] 錯誤:', e.message, e.stack)
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
