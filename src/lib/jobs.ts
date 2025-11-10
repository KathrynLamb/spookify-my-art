// src/lib/jobs.ts

export type SpookifyJobStatus =
  | 'queued'
  | 'working'
  | 'processing' // keep for backward-compat with worker
  | 'done'
  | 'error';

export type SpookifyJobInput = {
  imageId: string;
  promptOverride?: string | null;
  orientation?: 'Horizontal' | 'Vertical' | 'Square';
  target?: { aspect?: number; minWidth?: number; mode?: 'cover' | 'contain' };
  title?: string | null;
  userId?: string | null;
  productPlan?: { productId: string; reasonShort?: string } | null;
};

export type SpookifyJob = {
  id: string;
  createdAt: number;
  updatedAt: number;
  status: SpookifyJobStatus;
  input: SpookifyJobInput;

  // urls set by worker
  resultUrl?: string | null;
  resultFullUrl?: string | null;
  previewUrl?: string | null;

  error?: string | null;
};

declare global {
  var __SPOOKIFY_JOBS__: Map<string, SpookifyJob> | undefined;
}

// in-memory store (dev / fallback)
const store: Map<string, SpookifyJob> = (globalThis.__SPOOKIFY_JOBS__ ??= new Map());
const now = () => Date.now();

export function newJob(input: SpookifyJobInput): SpookifyJob {
  return {
    id: (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)) + Date.now().toString(36),
    createdAt: now(),
    updatedAt: now(),
    status: 'queued',
    input,
  };
}

export async function createJob(job: SpookifyJob) {
  store.set(job.id, job);
}

export async function getJob(id: string): Promise<SpookifyJob | null> {
  return store.get(id) ?? null;
}

export async function setWorking(id: string) {
  const j = store.get(id);
  if (j) {
    j.status = 'working';
    j.updatedAt = now();
    store.set(id, j);
  }
}

export async function setDone(id: string, url: string, full?: string, preview?: string) {
  const j = store.get(id);
  if (j) {
    j.status = 'done';
    j.resultUrl = url;
    if (full) j.resultFullUrl = full;
    if (preview) j.previewUrl = preview;
    j.updatedAt = now();
    store.set(id, j);
  }
}

export async function setError(id: string, message: string) {
  const j = store.get(id);
  if (j) {
    j.status = 'error';
    j.error = message;
    j.updatedAt = now();
    store.set(id, j);
  }
}

/**
 * Generic patch helper used by the worker route.
 * Merges fields and bumps updatedAt. Returns the updated job or null.
 */
export async function updateJob(id: string, patch: Partial<SpookifyJob>): Promise<SpookifyJob | null> {
  const j = store.get(id);
  if (!j) return null;
  const updated: SpookifyJob = { ...j, ...patch, updatedAt: now() };
  store.set(id, updated);
  return updated;
}

/* ---------- Optional: simple self-test used by /api/spookify/selftest ---------- */

export type KVSelfTestResult = {
  backend: 'memory';
  envs: { VERCEL_KV: boolean; UPSTASH_REDIS: boolean };
  wrote: { ok: true; ts: number };
  read: unknown;
};

export async function kvSelfTest(): Promise<KVSelfTestResult> {
  const backend = 'memory' as const;
  const envs = {
    VERCEL_KV: !!process.env.KV_REST_API_URL || !!process.env.KV_URL,
    UPSTASH_REDIS: !!process.env.UPSTASH_REDIS_REST_URL,
  };

  const testKey = `spookify:selftest:${Date.now()}`;
  const wrote = { ok: true as const, ts: Date.now() };

  store.set(testKey, {
    id: testKey,
    createdAt: wrote.ts,
    updatedAt: wrote.ts,
    status: 'queued',
    input: { imageId: 'selftest' },
  });

  const read = store.get(testKey) ?? null;
  return { backend, envs, wrote, read };
}
