import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export const runtime = 'nodejs';

// Minimal type for Cloudinary result we care about
type CloudinaryUploadResult = {
  public_id: string;
  secure_url: string;
  [key: string]: unknown; // Allow extra fields
};

// Configure once at module load
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise<CloudinaryUploadResult>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'ai-gifts/references',
            format: 'jpg',
          },
          (err, result) => {
            if (err || !result) {
              return reject(err || new Error('No result from Cloudinary'));
            }
            resolve(result as CloudinaryUploadResult);
          }
        );

        stream.end(buffer);
      }
    );

    return NextResponse.json({
      imageId: uploadResult.public_id,
      url: uploadResult.secure_url,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message });
  }
}
