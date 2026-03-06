import { NextResponse } from 'next/server';
import { getCases, createCase } from '@/lib/notion';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const team = searchParams.get('team') || undefined;
    const cases = await getCases({ status, team });
    return NextResponse.json(cases);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const result = await createCase(data);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
