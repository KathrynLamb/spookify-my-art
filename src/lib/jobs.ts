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
  resultFullUrl?: string | null; // used by worker for full-res URL
  error?: string | null;
  input: SpookifyJobInput;
  createdAt: number;
  updatedAt: number;
};

export const JOB_TTL_SECONDS = 60 * 60; // 1 hour

/* ================= Backend detection ================= */

const useKV =
  !!process.env.KV_REST_API_URL ||
  !!process.env.KV_REST_API_TOKEN ||
  !!process.env.KV_URL ||
  !!process.env.VERCEL_KV_URL ||
  !!process.env.UPSTASH_REDIS_REST_URL ||
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

const mem = new Map<string, SpookifyJob>(); // dev/local fallback (not shared)

const key = (id: string) => `spookify:job:${id}`;

type KVLike = {
  get<T>(k: string): Promise<T | null>;
  set(k: string, v: unknown): Promise<void>;
  expire(k: string, seconds: number): Promise<void>;
  backend: 'vercel-kv' | 'upstash-redis';
};

let kvClient: KVLike | null = null;

async function getKV(): Promise<KVLike | null> {
  if (!useKV) return null;
  if (kvClient) return kvClient;

  // Prefer @vercel/kv if available
  try {
    // dynamic import so local dev works without the package
    type VercelKVModule = {
      kv?: {
        get<T>(k: string): Promise<T | null>;
        set(k: string, v: unknown, opts?: { ex?: number }): Promise<unknown>;
        expire(k: string, seconds: number): Promise<unknown>;
      };
    };
    
    const mod = (await import('@vercel/kv').catch(() => ({}))) as VercelKVModule;
    
// inside getKV(), when @vercel/kv is detected
if (mod?.kv) {
  const real = mod.kv as {
    get<T>(k: string): Promise<T | null>;
    set(k: string, v: unknown, opts?: { ex?: number }): Promise<unknown>;
    expire(k: string, seconds: number): Promise<unknown>;
  };

  kvClient = {
    backend: 'vercel-kv',  // ← add this
    async get<T>(k: string): Promise<T | null> {
      const raw = await real.get(k);
      if (raw === null || raw === undefined) return null;
      if (typeof raw === 'string') {
        try { return JSON.parse(raw) as T; } catch { return raw as unknown as T; }
      }
      return raw as T;
    },
    async set(k: string, v: unknown): Promise<void> {
      await real.set(k, v);
    },
    async expire(k: string, seconds: number): Promise<void> {
      await real.expire(k, seconds);
    },
  };

  return kvClient;
}

  } catch {
    // fall through to Upstash
  }

  // Try Upstash REST client
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { Redis } = await import('@upstash/redis');
    const client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    kvClient = {
      backend: 'upstash-redis',
      async get<T>(k: string): Promise<T | null> {
        const raw = await client.get<unknown>(k);
        if (raw == null) return null;
        if (typeof raw === 'string') {
          try { return JSON.parse(raw) as T; } catch { return raw as unknown as T; }
        }
        return raw as T;
      },
      async set(k: string, v: unknown): Promise<void> {
        const payload = typeof v === 'string' ? v : JSON.stringify(v);
        await client.set(k, payload);
        await client.expire(k, JOB_TTL_SECONDS);
      },
      async expire(k: string, seconds: number): Promise<void> {
        await client.expire(k, seconds);
      },
    };
    
    return kvClient;
  }

  return null;
}

/* ================= Public API ================= */

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
    return (await kv.get<SpookifyJob>(key(id))) ?? null;
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
  return { id, status: 'queued', input, createdAt: now, updatedAt: now };
}

function cryptoRandomId(): string {
  if (typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto) {
    return (globalThis.crypto as Crypto).randomUUID();
  }
  // Node < 19 fallback
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/* Optional: quick health check to verify which backend is active */
export async function kvSelfTest() {
  const envs = {
    VERCEL_KV: !!process.env.KV_REST_API_URL || !!process.env.KV_URL,
    UPSTASH_REDIS: !!process.env.UPSTASH_REDIS_REST_URL,
  };
  const kv = await getKV();
  const backend = kv?.backend ?? 'memory';

  const testKey = `spookify:selftest:${Date.now()}`;
  const payload = { ok: true, ts: Date.now(), backend };

  if (kv) {
    await kv.set(testKey, payload);
    const roundtrip = await kv.get<typeof payload>(testKey);
    await kv.expire(testKey, 60);
    return { backend, envs, wrote: payload, read: roundtrip };
  } else {
    mem.set(testKey, {
      id: testKey,
      status: 'queued',
      input: { imageId: 'selftest' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return { backend, envs, wrote: payload, read: mem.get(testKey) ?? null };
  }
}
