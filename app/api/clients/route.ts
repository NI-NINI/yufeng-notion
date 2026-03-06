import { NextResponse } from 'next/server';
import { getClients, createClient } from '@/lib/notion';

export async function GET() {
  try {
    const clients = await getClients();
    return NextResponse.json(clients);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const result = await createClient(data);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
