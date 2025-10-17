import 'server-only';

export type SpookifyJobInput = {
  imageId: string;
  promptOverride?: string | null;
};

export type Job = {
  id: string;
  status: 'queued' | 'processing' | 'done' | 'error';
  imageId: string;
  resultUrl?: string | null;
  error?: string | null;
  input?: SpookifyJobInput;   // ← strongly typed
  createdAt: number;
  updatedAt: number;
};

const memory = new Map<string, Job>();

export async function saveJob(job: Job) {
  memory.set(job.id, job);
}

export async function getJob(id: string): Promise<Job | null> {
  return memory.get(id) ?? null;
}

export async function updateJob(id: string, patch: Partial<Job>): Promise<Job | null> {
  const cur = memory.get(id);
  if (!cur) return null;
  const next: Job = { ...cur, ...patch, updatedAt: Date.now() };
  memory.set(id, next);
  return next;
}
