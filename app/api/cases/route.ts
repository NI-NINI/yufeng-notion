import { NextRequest, NextResponse } from 'next/server'
import { fetchAllCases, createCase, updateCase } from '@/lib/notion'

export async function GET() {
  try {
    const cases = await fetchAllCases()
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
