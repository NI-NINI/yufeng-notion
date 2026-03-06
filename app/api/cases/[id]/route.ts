import { NextResponse } from 'next/server';
import { getCase, updateCase } from '@/lib/notion';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const c = await getCase(params.id);
    return NextResponse.json(c);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const result = await updateCase(params.id, data);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
