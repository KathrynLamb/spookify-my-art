// src/app/api/get-plan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import memStore from '@/lib/memStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id') || '';
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const item = memStore.get(id);

  // Return both, defaulting to null for stability
  return NextResponse.json(
    {
      plan: item?.plan ?? null,
      productPlan: item?.productPlan ?? null,
    },
    {
      headers: {
        // make sure clients don’t cache interim plans
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        Pragma: 'no-cache',
      },
    }
  );
}
