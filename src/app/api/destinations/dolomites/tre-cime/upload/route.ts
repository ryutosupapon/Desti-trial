import { NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided (field: file)' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const folder = path.join(process.cwd(), 'public', 'destinations', 'dolomites', 'tre-cime')
    await mkdir(folder, { recursive: true })

    const outPath = path.join(folder, 'primary.jpg')
    await writeFile(outPath, buffer)

  // Since large images are being migrated to S3, return the S3 URL instead of local path.
  // NOTE: This route still writes locally for backward compatibility; consider removing local write once all consumers use S3.
  return NextResponse.json({ success: true, url: 'https://desti-images.s3.us-east-2.amazonaws.com/destinations/dolomites/tre-cime/primary.jpg' })
  } catch (e) {
    console.error('Tre Cime upload failed:', e)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
