import heic2any from 'heic2any'

export async function convertHEICtoJPG(file: File): Promise<File> {
  const outputBlob = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.9,
  }) as Blob

  return new File([outputBlob], file.name.replace(/\.heic$/i, '.jpg'), {
    type: 'image/jpeg',
  })
}
