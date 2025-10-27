// src/lib/jobs.ts

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
  imageId?: string;               // optional legacy echo
  resultUrl?: string | null;
  error?: string | null;
  input: SpookifyJobInput;
  createdAt: number;
  updatedAt: number;
};

const JOB_TTL_SECONDS = 60 * 60;
const useKV = !!process.env.KV_URL || !!process.env.UPSTASH_REDIS_REST_URL;

const mem = new Map<string, SpookifyJob>();

function key(id: string) {
  return `spookify:job:${id}`;
}

/* ---------------- KV client (lazy, typed) ---------------- */

type KVLike = {
  get?<T = unknown>(k: string): Promise<T | null>;
  set?(k: string, v: unknown, opts?: { ex?: number }): Promise<void>;
  hgetall?<T = Record<string, unknown>>(k: string): Promise<T | null>;
  hset?(k: string, v: Record<string, unknown>): Promise<void>;
  expire?(k: string, seconds: number): Promise<void>;
};

type VercelKVModule = { kv?: KVLike };

let kv: KVLike | null = null;

async function getKV(): Promise<KVLike | null> {
  if (!useKV) return null;
  if (kv) return kv;

  const modUnknown = await import('@vercel/kv').catch(() => null);
  const mod = (modUnknown ?? null) as VercelKVModule | null;

  if (!mod || !mod.kv) {
    console.warn('[jobs] No @vercel/kv available, using memory store.');
    return null;
  }
  kv = mod.kv;
  return kv;
}

/* -------------- JSON encode/decode for hash mode -------------- */

function encodeJobForHash(job: SpookifyJob): Record<string, unknown> {
  return { json: JSON.stringify(job) };
}

function decodeJobFromHash<T = SpookifyJob>(
  rec: Record<string, unknown> | null
): T | null {
  if (!rec) return null;
  const raw = rec.json;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T;
    } catch (e) {
      console.error('[jobs] Failed to parse job.json from KV hash:', e);
      return null;
    }
  }
  return rec as unknown as T;
}

/* --------------------------- Public API --------------------------- */

export async function createJob(job: SpookifyJob) {
  const client = await getKV();

  if (client?.set) {
    console.info('[jobs] KV.set create', key(job.id));
    await client.set(key(job.id), job, { ex: JOB_TTL_SECONDS });
    return;
  }
  if (client?.hset && client?.expire) {
    console.info('[jobs] KV.hset(create)+expire', key(job.id));
    await client.hset(key(job.id), encodeJobForHash(job));
    await client.expire(key(job.id), JOB_TTL_SECONDS);
    return;
  }

  console.info('[jobs] MEM.create', job.id);
  mem.set(job.id, job);
}

export async function getJob(id: string): Promise<SpookifyJob | null> {
  const client = await getKV();

  if (client?.get) {
    const k = key(id);
    const found = await client.get<SpookifyJob>(k);
    if (found && client.expire) await client.expire(k, JOB_TTL_SECONDS);
    return found ?? null;
  }
  if (client?.hgetall) {
    const rec = await client.hgetall<Record<string, unknown>>(key(id));
    return decodeJobFromHash<SpookifyJob>(rec);
  }
  return mem.get(id) ?? null;
}

export async function updateJob(
  id: string,
  patch: Partial<SpookifyJob>
): Promise<SpookifyJob | null> {
  const existing = await getJob(id);
  if (!existing) {
    console.warn('[jobs] updateJob: not found', id);
    return null;
  }

  const updated: SpookifyJob = {
    ...existing,
    ...patch,
    input: { ...(existing.input ?? {}), ...(patch.input ?? {}) },
    updatedAt: Date.now(),
  };

  const client = await getKV();

  if (client?.set) {
    console.info('[jobs] KV.set update', key(id));
    await client.set(key(id), updated, { ex: JOB_TTL_SECONDS });
    return updated;
  }
  if (client?.hset && client?.expire) {
    console.info('[jobs] KV.hset(update)+expire', key(id));
    await client.hset(key(id), encodeJobForHash(updated));
    await client.expire(key(id), JOB_TTL_SECONDS);
    return updated;
  }

  console.info('[jobs] MEM.update', id);
  mem.set(id, updated);
  return updated;
}

export function newJob(input: SpookifyJobInput): SpookifyJob {
  const id = cryptoRandomId();
  const now = Date.now();
  return {
    id,
    status: 'queued',
    imageId: input.imageId,
    input,
    createdAt: now,
    updatedAt: now,
  };
}

function cryptoRandomId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
