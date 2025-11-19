import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import path from 'path'
import { mkdir, writeFile, access } from 'fs/promises'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params
    const destination = await prisma.curatedDestination.findFirst({
      where: {
        key,
        isActive: true,
      },
      include: {
        locations: {
          where: { isActive: true },
          include: {
            photos: {
              where: { isActive: true },
              orderBy: [
                { isPrimary: 'desc' },
                { createdAt: 'asc' },
              ],
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    })

    if (!destination) {
      return NextResponse.json(
        { error: 'Destination not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ destination, locations: destination.locations })
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}

// Create a new curated location for a destination. Supports JSON (photoPath) or multipart (file).
const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(''),
  locationType: z.string().default('viewpoint'),
  difficulty: z.string().default('easy'),
  bestTime: z.string().default(''),
  coordinates: z.string().default(''),
  photoPath: z.string().optional(), // for JSON-only flow
})

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params
  try {
    const destination = await prisma.curatedDestination.findFirst({ where: { key, isActive: true } })
    if (!destination) {
      return NextResponse.json({ error: 'Destination not found' }, { status: 404 })
    }

    const contentType = request.headers.get('content-type') || ''
    let parsed: z.infer<typeof createSchema> | null = null
    let uploadedPath: string | undefined

    if (contentType.includes('application/json')) {
      parsed = createSchema.parse(await request.json())
    } else if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      const name = String(form.get('name') || '')
      const description = String(form.get('description') || '')
      const locationType = String(form.get('locationType') || 'viewpoint')
      const difficulty = String(form.get('difficulty') || 'easy')
      const bestTime = String(form.get('bestTime') || '')
      const coordinates = String(form.get('coordinates') || '')
      const file = form.get('file') as File | null
      if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

      // Optional file upload -> writes to /public/destinations/<key>/<slug>/primary.jpg
      if (file) {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const slug = slugify(name)
        const publicRoot = path.join(process.cwd(), 'public')
        const target = path.join(publicRoot, 'destinations', key, slug, 'primary.jpg')
        await mkdir(path.dirname(target), { recursive: true })
        await writeFile(target, buffer)
        uploadedPath = `/destinations/${key}/${slug}/primary.jpg`
      }

      parsed = createSchema.parse({ name, description, locationType, difficulty, bestTime, coordinates, photoPath: uploadedPath })
    } else {
      return NextResponse.json({ error: 'Unsupported content-type' }, { status: 415 })
    }

    const nameKey = parsed.name.toLowerCase().trim()
    const existing = await prisma.curatedLocation.findFirst({
      where: { destinationId: destination.id, name: parsed.name },
    })
    if (existing) {
      return NextResponse.json({ error: 'Location with same name already exists' }, { status: 409 })
    }

    const slug = slugify(parsed.name)
    const url = parsed.photoPath || `/destinations/${key}/${slug}/primary.jpg`

    // Ensure placeholder file exists if none uploaded and file missing
    const publicRoot = path.join(process.cwd(), 'public')
    const target = path.join(publicRoot, url.replace(/^\//, ''))
    try {
      await access(target)
    } catch {
      await mkdir(path.dirname(target), { recursive: true })
      const tinyJpegBase64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxISEhUVFRUVFRUVFRUVFRUVFRUVFRUWFxUVFRUYHSggGBolHRUVITEhJSkrLi4uFx8zODMsNygtLisBCgoKDg0OGxAQGy0lICUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAEAAQMBIgACEQEDEQH/xAAbAAABBQEBAAAAAAAAAAAAAAAFAAMEBgcBAv/EADMQAAEDAgQEAwYHAAAAAAAAAAECAwQAEQUSIQYTMUFRFCJxgZGh8CKhQpLB0fAUM1Ny0v/EABkBAAMBAQEAAAAAAAAAAAAAAAABAgMEBf/EACQRAQEAAgIBAwQDAAAAAAAAAAABAhEDBBIhMUFREyJxgZGx/9oADAMBAAIRAxEAPwD0QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//Z'
      await writeFile(target, Buffer.from(tinyJpegBase64.replace(/^data:[^,]*,/, ''), 'base64'))
    }

    const created = await prisma.curatedLocation.create({
      data: {
        destinationId: destination.id,
        name: parsed.name,
        description: parsed.description,
        locationType: parsed.locationType,
        difficulty: parsed.difficulty,
        bestTime: parsed.bestTime,
        coordinates: parsed.coordinates,
        photos: {
          create: [{ url, thumbnailUrl: url, altText: parsed.name, isPrimary: true }],
        },
      },
      include: { photos: true },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    if (err?.issues) {
      return NextResponse.json({ error: 'Invalid data', details: err.issues }, { status: 400 })
    }
    console.error('Create location failed:', err)
    return NextResponse.json({ error: 'Failed to create location' }, { status: 500 })
  }
}
