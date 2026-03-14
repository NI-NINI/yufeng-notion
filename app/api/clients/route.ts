import { NextRequest, NextResponse } from 'next/server'
import { fetchAllClients, createClient, updateClient, deleteClient } from '@/lib/notion'

export async function GET() {
  try {
    const clients = await fetchAllClients()
    return NextResponse.json(clients)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const page = await createClient(data)
    return NextResponse.json(page)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...data } = await req.json()
    const page = await updateClient(id, data)
    return NextResponse.json(page)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    await deleteClient(id)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
