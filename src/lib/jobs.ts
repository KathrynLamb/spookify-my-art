// import 'server-only';

// export type SpookifyJobInput = {
//   imageId: string;
//   promptOverride: string | null;
//   target?: {
//     aspect?: number;                // desired width/height ratio
//     minWidth?: number;              // desired min output width in px
//     mode?: 'cover' | 'contain';     // crop vs pad
//   };
//   orientation?: 'Horizontal' | 'Vertical' | 'Square'; // optional hint
// };


// export type Job = {
//   id: string;
//   status: 'queued' | 'processing' | 'done' | 'error';
//   imageId: string;
//   resultUrl?: string | null;
//   error?: string | null;
//   input?: SpookifyJobInput;   // ← strongly typed
//   createdAt: number;
//   updatedAt: number;
// };

// const memory = new Map<string, Job>();

// export async function saveJob(job: Job) {
//   memory.set(job.id, job);
// }

// export async function getJob(id: string): Promise<Job | null> {
//   return memory.get(id) ?? null;
// }

// export async function updateJob(id: string, patch: Partial<Job>): Promise<Job | null> {
//   const cur = memory.get(id);
//   if (!cur) return null;
//   const next: Job = { ...cur, ...patch, updatedAt: Date.now() };
//   memory.set(id, next);
//   return next;
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

const JOB_TTL_SECONDS = 60 * 60; // 1h – tune as needed
const useKV = !!process.env.KV_URL || !!process.env.UPSTASH_REDIS_REST_URL;

const mem = new Map<string, SpookifyJob>(); // dev fallback only

function key(id: string) {
  return `spookify:job:${id}`;
}

// ---- Vercel KV (or compatible) ----
type KVClient = {
  hgetall<T>(k: string): Promise<T | null>;
  hset(k: string, v: Record<string, unknown>): Promise<void>;
  expire(k: string, seconds: number): Promise<void>;
};
let kv: KVClient | null = null;

async function getKV(): Promise<KVClient | null> {
  if (!useKV) return null;
  if (kv) return kv;
  // Lazy import to avoid bundling in dev
  const mod = await import('@vercel/kv').catch(() => null);
  if (!mod || !mod.kv) return null;
  kv = mod.kv as unknown as KVClient;
  return kv;
}

// ---- Public API ----
export async function createJob(job: SpookifyJob) {
  const client = await getKV();
  if (client) {
    await client.hset(key(job.id), job as unknown as Record<string, unknown>);
    await client.expire(key(job.id), JOB_TTL_SECONDS);
  } else {
    mem.set(job.id, job);
  }
}

export async function getJob(id: string): Promise<SpookifyJob | null> {
  const client = await getKV();
  if (client) {
    const j = await client.hgetall<SpookifyJob>(key(id));
    return (j as SpookifyJob) ?? null;
  }
  return mem.get(id) ?? null;
}

export async function updateJob(id: string, patch: Partial<SpookifyJob>) {
  const existing = await getJob(id);
  if (!existing) return;
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

function cryptoRandomId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
