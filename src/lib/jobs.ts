// // src/lib/jobs.ts
// export type Orientation = 'Horizontal' | 'Vertical' | 'Square';

// export type SpookifyJobInput = {
//   imageId: string;
//   promptOverride?: string | null;
//   orientation?: Orientation;
//   target?: {
//     aspect?: number;
//     minWidth?: number;
//     mode?: 'cover' | 'contain';
//   };
// };

// export type SpookifyJob = {
//   id: string;
//   status: 'queued' | 'processing' | 'done' | 'error';
//   resultUrl?: string | null;
//   error?: string | null;
//   input: SpookifyJobInput;
//   createdAt: number;
//   updatedAt: number;
// };

// const JOB_TTL_SECONDS = 60 * 60; // 1h
// const useKV = !!process.env.KV_URL || !!process.env.UPSTASH_REDIS_REST_URL;

// // In-memory fallback for dev / no-KV
// const mem = new Map<string, SpookifyJob>();

// function key(id: string) {
//   return `spookify:job:${id}`;
// }

// type KVLike = {
//   get<T>(k: string): Promise<T | null>;
//   set(k: string, v: unknown): Promise<void>;
//   expire(k: string, seconds: number): Promise<void>;
// };

// let kvClient: KVLike | null = null;

// async function getKV(): Promise<KVLike | null> {
//   if (!useKV) return null;
//   if (kvClient) return kvClient;

//   // Use official client; wrap as KVLike
//   const mod = await import('@vercel/kv').catch(() => null);
//   if (!mod || !('kv' in mod)) return null;

//   const real = (mod as unknown as { kv: any }).kv; // runtime value from lib
//   kvClient = {
//     async get<T>(k: string): Promise<T | null> {
//       // We store JSON strings; parse on read
//       const raw = await real.get<string>(k);
//       if (!raw) return null;
//       try {
//         return JSON.parse(raw) as T;
//       } catch {
//         return null;
//       }
//     },
//     async set(k: string, v: unknown): Promise<void> {
//       // Always stringify once; avoids zod arg shape issues
//       await real.set(k, JSON.stringify(v));
//     },
//     async expire(k: string, seconds: number): Promise<void> {
//       await real.expire(k, seconds);
//     },
//   };
//   return kvClient;
// }

// /* ---------- Public API ---------- */

// export async function createJob(job: SpookifyJob): Promise<void> {
//   const kv = await getKV();
//   if (kv) {
//     await kv.set(key(job.id), job);
//     await kv.expire(key(job.id), JOB_TTL_SECONDS);
//     return;
//   }
//   mem.set(job.id, job);
// }

// export async function getJob(id: string): Promise<SpookifyJob | null> {
//   const kv = await getKV();
//   if (kv) {
//     const j = await kv.get<SpookifyJob>(key(id));
//     return j ?? null;
//   }
//   return mem.get(id) ?? null;
// }

// export async function updateJob(
//   id: string,
//   patch: Partial<SpookifyJob>
// ): Promise<SpookifyJob | null> {
//   const existing = await getJob(id);
//   if (!existing) return null;

//   const updated: SpookifyJob = { ...existing, ...patch, updatedAt: Date.now() };

//   const kv = await getKV();
//   if (kv) {
//     await kv.set(key(id), updated);
//     await kv.expire(key(id), JOB_TTL_SECONDS);
//   } else {
//     mem.set(id, updated);
//   }
//   return updated;
// }

// export function newJob(input: SpookifyJobInput): SpookifyJob {
//   const id = cryptoRandomId();
//   const now = Date.now();
//   return {
//     id,
//     status: 'queued',
//     input,
//     createdAt: now,
//     updatedAt: now,
//   };
// }

// function cryptoRandomId(): string {
//   if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {

//     return crypto.randomUUID();
//   }
//   return Math.random().toString(36).slice(2) + Date.now().toString(36);
// }
// /src/lib/jobs.ts

export type SpookifyJobInput = {
  imageId: string;
  promptOverride?: string | null;
  orientation?: 'Horizontal' | 'Vertical' | 'Square';
  target?: {
    aspect?: number;
    minWidth?: number;
    mode?: 'cover' | 'contain';
  };
};

export type SpookifyJob = {
  id: string;
  status: 'queued' | 'processing' | 'done' | 'error';
  resultUrl?: string | null;
  error?: string | null;
  input: SpookifyJobInput;
  createdAt: number;
  updatedAt: number;
};

console.log('[jobs] KV enabled?', !!(process.env.KV_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.VERCEL_KV_URL));


const JOB_TTL_SECONDS = 60 * 60; // 1 hour
const useKV =
  !!process.env.KV_URL ||
  !!process.env.UPSTASH_REDIS_REST_URL ||
  !!process.env.VERCEL_KV_URL; // any signal that KV is configured

const mem = new Map<string, SpookifyJob>(); // dev / local fallback

function key(id: string) {
  return `spookify:job:${id}`;
}

/** Minimal typed surface we actually use from @vercel/kv */
type VercelKV = {
  hgetall<T>(k: string): Promise<T | null>;
  hset(k: string, v: Record<string, unknown>): Promise<number | void>;
  expire(k: string, seconds: number): Promise<number | void>;
};

type KVModule = { kv: VercelKV };

let kvClient: VercelKV | null = null;

async function getKV(): Promise<VercelKV | null> {
  if (!useKV) return null;
  if (kvClient) return kvClient;

  const mod = (await import('@vercel/kv').catch(() => null)) as KVModule | null;
  if (!mod || !mod.kv) return null;

  kvClient = mod.kv;
  return kvClient;
}

// ---------------- Public API ----------------

export async function createJob(job: SpookifyJob): Promise<void> {
  const client = await getKV();
  if (client) {
    await client.hset(key(job.id), job as unknown as Record<string, unknown>);
    await client.expire(key(job.id), JOB_TTL_SECONDS);
    return;
  }
  mem.set(job.id, job);
}

export async function getJob(id: string): Promise<SpookifyJob | null> {
  const client = await getKV();
  if (client) {
    const j = await client.hgetall<SpookifyJob>(key(id));
    return j ?? null;
  }
  return mem.get(id) ?? null;
}

export async function updateJob(
  id: string,
  patch: Partial<SpookifyJob>
): Promise<SpookifyJob | null> {
  const existing = await getJob(id);
  if (!existing) return null;

  const updated: SpookifyJob = {
    ...existing,
    ...patch,
    updatedAt: Date.now(),
  };

  const client = await getKV();
  if (client) {
    await client.hset(key(id), updated as unknown as Record<string, unknown>);
    await client.expire(key(id), JOB_TTL_SECONDS);
  } else {
    mem.set(id, updated);
  }

  return updated;
}

export function newJob(input: SpookifyJobInput): SpookifyJob {
  const id = cryptoRandomId();
  const now = Date.now();
  return {
    id,
    status: 'queued',
    input,
    createdAt: now,
    updatedAt: now,
  };
}

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as Crypto).randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
