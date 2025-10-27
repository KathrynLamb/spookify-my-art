// // src/app/api/spookify/status/route.ts
// import { NextResponse } from 'next/server';
// import { getJob } from '@/lib/jobs';

// export const runtime = 'nodejs';
// export const dynamic = 'force-dynamic';

// export async function GET(req: Request) {
//   const url = new URL(req.url);
//   const id = url.searchParams.get('id') || url.searchParams.get('jobId') || '';

//   if (!id) {
//     return NextResponse.json({ error: 'Missing job id' }, { status: 400, headers: noCache() });
//   }

//   const job = await getJob(id);
//   console.log('[spookify-status] id =', id, 'found =', !!job);

//   if (!job) {
//     return NextResponse.json({ error: 'Not found' }, { status: 404, headers: noCache() });
//   }

//   return NextResponse.json(
//     {
//       status: job.status,
//       resultUrl: job.resultUrl ?? null,
//       error: job.error ?? null,
//     },
//     { headers: noCache() }
//   );
// }

// function noCache() {
//   return {
//     'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
//     Pragma: 'no-cache',
//   };
// }
// app/api/spookify/status/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getJob } from '@/lib/jobs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || '';
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const job = await getJob(id);
  if (!job) return NextResponse.json({ found: false }, { status: 200 });

  return NextResponse.json({
    found: true,
    id: job.id,
    status: job.status,
    resultUrl: job.resultUrl ?? null,
    resultFullUrl: (job as any).resultFullUrl ?? null, // included by worker
    error: job.error ?? null,
    updatedAt: job.updatedAt,
  });
}
