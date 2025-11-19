import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import path from 'path'
import { mkdir, writeFile } from 'fs/promises'

export const runtime = 'nodejs'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { photoId } = await params
    if (!photoId) {
      return NextResponse.json({ error: 'Missing photoId' }, { status: 400 })
    }

    const curated = await prisma.curatedPhoto.findUnique({ where: { id: photoId } })
    if (!curated) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    const url = curated.url || ''
    // We only support replacing public assets that live under /public
    if (!url || !url.startsWith('/')) {
      return NextResponse.json({ error: 'Invalid photo URL to overwrite' }, { status: 400 })
    }

    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided (field: file)' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const publicRoot = path.join(process.cwd(), 'public')
    const targetPath = path.join(publicRoot, url.replace(/^\//, ''))

    // Ensure the resolved path is still inside the public directory (prevent traversal)
    const normalizedPublic = path.resolve(publicRoot)
    const normalizedTarget = path.resolve(targetPath)
    if (!normalizedTarget.startsWith(normalizedPublic)) {
      return NextResponse.json({ error: 'Resolved path escapes public root' }, { status: 400 })
    }

    await mkdir(path.dirname(normalizedTarget), { recursive: true })
    await writeFile(normalizedTarget, buffer)

    return NextResponse.json({ success: true, url })
  } catch (e) {
    console.error('Generic curated photo upload failed:', e)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
