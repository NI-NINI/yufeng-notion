import { NextRequest, NextResponse } from 'next/server'
import { fetchAllPayments, createPayment } from '@/lib/notion'

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
    const page = await createPayment(body)
    return NextResponse.json({ id: page.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
