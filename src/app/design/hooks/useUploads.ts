'use client';

import { useCallback, useState } from 'react';

type UploadResult = {
  imageId: string;
  url: string;
};

type UploadResponse = {
  imageId: string;
  url: string;
  ok?: boolean;
  error?: string;
};

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'];

export function useUploads() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = useCallback(async (file: File): Promise<UploadResult> => {
    if (!file) throw new Error('No file provided');

    const ext = file.name.split('.').pop()?.toLowerCase();
    const mime = file.type;

    const looksLikeImage =
      (mime && mime.startsWith('image/')) ||
      (ext && IMAGE_EXTS.includes(ext));

    if (!looksLikeImage) {
      throw new Error('Please upload an image file (jpg, png, webp, heic).');
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setProgress(0);

    try {
      const res = await fetch('/api/upload-reference', {
        method: 'POST',
        body: formData,
      });

      // Cloudinary returns text; sometimes error HTML
      const text = await res.text();

      let json: UploadResponse;
      try {
        json = JSON.parse(text) as UploadResponse;
      } catch {
        throw new Error(text || `Upload failed with status ${res.status}`);
      }

      if (!res.ok) {
        throw new Error(json.error || `Upload failed with status ${res.status}`);
      }

      if (!json.imageId || !json.url) {
        throw new Error('Upload response missing imageId or url');
      }

      setProgress(100);

      return {
        imageId: json.imageId,
        url: json.url,
      };
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploading, progress, handleUpload };
}
