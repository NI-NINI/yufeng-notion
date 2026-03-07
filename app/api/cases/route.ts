import { NextRequest, NextResponse } from 'next/server'
import { fetchAllCases, createCase } from '@/lib/notion'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const team = searchParams.get('team')
    const status = searchParams.get('status')
    const assignee = searchParams.get('assignee')

    const filters: any[] = []
    if (team) filters.push({ property: '負責組別', select: { equals: team } })
    if (status) filters.push({ property: '案件狀態', select: { equals: status } })
    if (assignee) filters.push({ property: '承辦人', multi_select: { contains: assignee } })

    const cases = await fetchAllCases(
      filters.length > 0 ? { filter: filters.length === 1 ? filters[0] : { and: filters } } : undefined
    )
    return NextResponse.json(cases)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const page = await createCase(body)
    return NextResponse.json({ id: page.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
