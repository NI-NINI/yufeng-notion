import { NextRequest, NextResponse } from 'next/server'

// 付款 DB 已移除，回傳空陣列避免 crash
export async function GET() {
  return NextResponse.json([])
}

export async function POST() {
  return NextResponse.json({ error: '付款功能暫停' }, { status: 503 })
}

export async function PATCH() {
  return NextResponse.json({ error: '付款功能暫停' }, { status: 503 })
}
