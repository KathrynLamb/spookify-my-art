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
  resultUrl?: string | null;
  error?: string | null;
  input: SpookifyJobInput;
  createdAt: number;
  updatedAt: number;
};

const JOB_TTL_SECONDS = 60 * 60; // 1 hour
const useKV =
  !!process.env.KV_URL ||
  !!process.env.UPSTASH_REDIS_REST_URL ||
  !!process.env.VERCEL_KV_URL;

// Dev/local fallback (not shared across lambdas)
const mem = new Map<string, SpookifyJob>();

function key(id: string) {
  return `spookify:job:${id}`;
}

/** Minimal KV client surface we use directly from @vercel/kv */
type RawKVClient = {
  get<T = string>(k: string): Promise<T | null>;
  set(k: string, v: string): Promise<unknown>;
  expire(k: string, seconds: number): Promise<unknown>;
};
type RawKVModule = { kv: RawKVClient };

/** Our wrapper interface (parses/serializes JSON so Zod never validates nested shapes). */
type KVLike = {
  get<T>(k: string): Promise<T | null>;
  set(k: string, v: unknown): Promise<void>;
  expire(k: string, seconds: number): Promise<void>;
};

let kvClient: KVLike | null = null;

async function getKV(): Promise<KVLike | null> {
  if (!useKV) return null;
  if (kvClient) return kvClient;

  const modUnknown = await import('@vercel/kv').catch(() => null as unknown);
  if (!modUnknown) return null;

  // Safely detect the named export `kv`
  const maybeModule = modUnknown as Partial<RawKVModule>;
  if (!maybeModule.kv) return null;

  const real: RawKVClient = maybeModule.kv;

  kvClient = {
    async get<T>(k: string): Promise<T | null> {
      const raw = await real.get<string>(k);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    },
    async set(k: string, v: unknown): Promise<void> {
      await real.set(k, JSON.stringify(v));
    },
    async expire(k: string, seconds: number): Promise<void> {
      await real.expire(k, seconds);
    },
  };

  return kvClient;
}

// ---------------- Public API ----------------

export async function createJob(job: SpookifyJob): Promise<void> {
  const kv = await getKV();
  if (kv) {
    await kv.set(key(job.id), job);
    await kv.expire(key(job.id), JOB_TTL_SECONDS);
    return;
  }
  mem.set(job.id, job);
}

export async function getJob(id: string): Promise<SpookifyJob | null> {
  const kv = await getKV();
  if (kv) {
    const j = await kv.get<SpookifyJob>(key(id));
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

  const updated: SpookifyJob = { ...existing, ...patch, updatedAt: Date.now() };

  const kv = await getKV();
  if (kv) {
    await kv.set(key(id), updated);
    await kv.expire(key(id), JOB_TTL_SECONDS);
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
  if (typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto) {
    return (globalThis.crypto as Crypto).randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
