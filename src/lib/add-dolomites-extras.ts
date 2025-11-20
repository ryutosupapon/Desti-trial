import { PrismaClient } from '@prisma/client'
import { mkdir, writeFile, access } from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

type NewLoc = {
  name: string
  slug: string
  description: string
  locationType: string
  difficulty: 'easy' | 'moderate' | 'hard'
  bestTime: string
  coordinates?: string
}

const extras: NewLoc[] = [
  {
    name: 'Cadini di Misurina',
    slug: 'cadini-di-misurina',
    description: 'Jagged spires above Lago di Misurina; iconic viewpoint hike.',
    locationType: 'viewpoint',
    difficulty: 'moderate',
    bestTime: 'Jun-Oct',
    coordinates: '46.5586,12.2823',
  },
  {
    name: 'Lago di Sorapis',
    slug: 'lago-di-sorapis',
    description: 'Milky-turquoise alpine lake reached via a popular trail.',
    locationType: 'lake',
    difficulty: 'moderate',
    bestTime: 'Jun-Oct',
    coordinates: '46.5515,12.2052',
  },
  {
    name: 'Val di Funes',
    slug: 'val-di-funes',
    description: 'Pastel villages and meadows beneath the Odle/Geisler peaks.',
    locationType: 'valley',
    difficulty: 'easy',
    bestTime: 'May-Oct',
    coordinates: '46.6440,11.6990',
  },
  {
    name: 'Adolf Munkelweg',
    slug: 'adolf-munkelweg',
    description: 'Forest and meadow trail at the foot of the Odle group.',
    locationType: 'hiking',
    difficulty: 'easy',
    bestTime: 'Jun-Oct',
    coordinates: '46.6303,11.7394',
  },
  {
    name: 'Karersee (Lago di Carezza)',
    slug: 'karersee',
    description: 'Emerald lake ringed by spruce forest and Latemar peaks.',
    locationType: 'lake',
    difficulty: 'easy',
    bestTime: 'May-Oct',
    coordinates: '46.4090,11.5755',
  },
]

async function main() {
  console.log('Adding extra Dolomites locations…')

  const dest = await prisma.curatedDestination.upsert({
    where: { key: 'dolomites' },
    update: { isActive: true },
    create: {
      key: 'dolomites',
      name: 'Dolomites, Italy',
      description: 'Dramatic limestone peaks, alpine meadows, and stunning mountain vistas',
      country: 'Italy',
      heroImage: '/destinations/dolomites/hero.jpg',
      isActive: true,
    },
  })

  for (const loc of extras) {
    const already = await prisma.curatedLocation.findFirst({
      where: { destinationId: dest.id, name: loc.name },
    })
    if (already) {
      console.log(`• Skipping existing: ${loc.name}`)
      continue
    }

    // Use S3 URL for large migrated assets (migrated: adolf-munkelweg, cadini-di-misurina, karersee, lago-di-braies, lago-di-sorapis, seceda, val-di-funes)
    const baseLocal = `/destinations/dolomites/${loc.slug}/primary.jpg`
    const s3Map: Record<string, string> = {
      'adolf-munkelweg': 'https://desti-images.s3.us-east-2.amazonaws.com/destinations/dolomites/adolf-munkelweg/primary.jpg',
      'cadini-di-misurina': 'https://desti-images.s3.us-east-2.amazonaws.com/destinations/dolomites/cadini-di-misurina/primary.jpg',
      'karersee': 'https://desti-images.s3.us-east-2.amazonaws.com/destinations/dolomites/karersee/primary.jpg',
      'lago-di-braies': 'https://desti-images.s3.us-east-2.amazonaws.com/destinations/dolomites/lago-di-braies/primary.jpg',
      'lago-di-sorapis': 'https://desti-images.s3.us-east-2.amazonaws.com/destinations/dolomites/lago-di-sorapis/primary.jpg',
      'seceda': 'https://desti-images.s3.us-east-2.amazonaws.com/destinations/dolomites/seceda/primary.jpg',
      'val-di-funes': 'https://desti-images.s3.us-east-2.amazonaws.com/destinations/dolomites/val-di-funes/primary.jpg',
    }
    const url = s3Map[loc.slug] || baseLocal
    const created = await prisma.curatedLocation.create({
      data: {
        destinationId: dest.id,
        name: loc.name,
        description: loc.description,
        locationType: loc.locationType,
        difficulty: loc.difficulty,
        bestTime: loc.bestTime,
        coordinates: loc.coordinates || '',
        photos: { create: [{ url, thumbnailUrl: url, altText: loc.name, isPrimary: true }] },
      },
    })

    // Prepare target folder for easy image drop-in
    const folder = path.join(process.cwd(), 'public', 'destinations', 'dolomites', loc.slug)
    await mkdir(folder, { recursive: true })
    const readmePath = path.join(folder, 'README.txt')
    const note = s3Map[loc.slug]
      ? `This location's primary image is served from S3 for deployment size reasons.\nS3 Object: ${url}\n(Local fallback path if needed: ${baseLocal})\n`
      : `Place your image at primary.jpg for ${loc.name}.\nExpected path: ${url}\n`
    await writeFile(readmePath, note)

    // Write a tiny JPEG placeholder if primary.jpg is missing
    const target = path.join(folder, 'primary.jpg')
    try { await access(target) } catch {
      const tinyJpegBase64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxISEhUVFRUVFRUVFRUVFRUVFRUVFRUWFxUVFRUYHSggGBolHRUVITEhJSkrLi4uFx8zODMsNygtLisBCgoKDg0OGxAQGy0lICUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAEAAQMBIgACEQEDEQH/xAAbAAABBQEBAAAAAAAAAAAAAAAFAAMEBgcBAv/EADMQAAEDAgQEAwYHAAAAAAAAAAECAwQAEQUSIQYTMUFRFCJxgZGh8CKhQpLB0fAUM1Ny0v/EABkBAAMBAQEAAAAAAAAAAAAAAAABAgMEBf/EACQRAQEAAgIBAwQDAAAAAAAAAAABAhEDBBIhMUFREyJxgZGx/9oADAMBAAIRAxEAPwD0QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//Z'
      await writeFile(target, Buffer.from(tinyJpegBase64.replace(/^data:[^,]*,/, ''), 'base64'))
    }

    console.log(`• Created: ${created.name} -> ${url}`)
  }

  console.log('Done.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
