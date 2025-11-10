export async function saveGreetingToBlob(dataUrl: string, imageId?: string): Promise<string> {
    const res = await fetch('/api/save-greeting', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ dataUrl, imageId }),
    });
    const j = await res.json();
    if (!res.ok || !j?.url) throw new Error(j?.error || 'Upload failed');
    return j.url as string;
  }
  