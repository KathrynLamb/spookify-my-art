// import { NextRequest, NextResponse } from 'next/server';
// import { v4 as uuidv4 } from 'uuid';
// import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// // import { app } from '@/lib/firebase/server'; // adjust path for your Firebase config

// export const runtime = 'nodejs';
// export const dynamic = 'force-dynamic';

// export async function POST(req: NextRequest) {
//   try {
//     const contentType = req.headers.get('content-type') || '';
//     // const storage = getStorage(app);

//     if (contentType.includes('multipart/form-data')) {
//       const formData = await req.formData();
//       const file = formData.get('file') as File;
//       if (!file) throw new Error('Missing file');

//       const arrayBuffer = await file.arrayBuffer();
//       const bytes = new Uint8Array(arrayBuffer);

//       const filename = file.name || `jollyfy-${uuidv4()}.jpg`;
//       const storageRef = ref(storage, `uploads/${filename}`);
//       await uploadBytes(storageRef, bytes, { contentType: file.type });
//       const url = await getDownloadURL(storageRef);
//       return NextResponse.json({ url });
//     }

//     if (contentType.includes('application/json')) {
//       const { dataUrl, filename = `jollyfy-${uuidv4()}.jpg` } = await req.json();
//       if (!dataUrl) throw new Error('Missing dataUrl');

//       const base64 = dataUrl.split(',')[1];
//       const buffer = Buffer.from(base64, 'base64');
//       const storageRef = ref(storage, `uploads/${filename}`);
//       await uploadBytes(storageRef, buffer, { contentType: 'image/jpeg' });
//       const url = await getDownloadURL(storageRef);
//       return NextResponse.json({ url });
//     }

//     throw new Error('Unsupported content type');
//   } catch (err: unknown) {
//     const message = err instanceof Error ? err.message : String(err);
//     return NextResponse.json({ error: message }, { status: 400 });
//   }
// }

// src/app/api/upload-jollyfy/route.ts
export { runtime, dynamic } from '../upload-original/route';
export { POST } from '../upload-original/route';
