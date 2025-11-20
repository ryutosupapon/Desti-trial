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

// Minimal extras list for Lofoten; extend as needed
const extras: NewLoc[] = [
  {
    name: 'Hamnøy',
    slug: 'hamn-y', // existing folder uses this slug variant
    description: 'Classic fishing village with iconic red rorbuer against sharp peaks.',
    locationType: 'village',
    difficulty: 'easy',
    bestTime: 'May-Sep',
    coordinates: '67.9483,13.1325',
  },
  {
    name: 'Haukland Beach',
    slug: 'haukland-beach',
    description: 'Turquoise water and white sand framed by green slopes; popular sunset spot.',
    locationType: 'beach',
    difficulty: 'easy',
    bestTime: 'Jun-Aug',
    coordinates: '68.2000,13.5250',
  },
  {
    name: 'Hesten',
    slug: 'hesten',
    description: 'Steep peak offering panoramic views toward Haukland and Uttakleiv.',
    locationType: 'hiking',
    difficulty: 'moderate',
    bestTime: 'Jun-Sep',
    coordinates: '68.2080,13.5000',
  },
  {
    name: 'Reinebrigen Viewpoint',
    slug: 'reinebrigen', // note: public folder uses this spelling; differs from "reinebringen"
    description: 'Iconic viewpoint above Reine after a steep stair climb.',
    locationType: 'viewpoint',
    difficulty: 'moderate',
    bestTime: 'Jun-Sep',
    coordinates: '67.9269,13.1062',
  },
  {
    name: 'Ryten',
    slug: 'ryten',
    description: 'Hike to cliff overlooking Kvalvika Beach and surrounding peaks.',
    locationType: 'hiking',
    difficulty: 'moderate',
    bestTime: 'Jun-Sep',
    coordinates: '68.0872,13.3141',
  },
  {
    name: 'Senja Viewpoint',
    slug: 'senja',
    description: 'Dramatic coastal panorama; treated here as part of extended Lofoten set.',
    locationType: 'viewpoint',
    difficulty: 'easy',
    bestTime: 'Jun-Sep',
  },
  {
    name: 'Tungeneset Boardwalk',
    slug: 'tungeneset',
    description: 'Boardwalk viewpoint over jagged peaks meeting the sea.',
    locationType: 'viewpoint',
    difficulty: 'easy',
    bestTime: 'Jun-Sep',
  },
]

async function main() {
  console.log('Adding extra Lofoten locations…')

  const dest = await prisma.curatedDestination.upsert({
    where: { key: 'lofoten' },
    update: { isActive: true },
    create: {
      key: 'lofoten',
      name: 'Lofoten, Norway',
      description: 'Jagged Arctic archipelago with dramatic peaks and fishing villages',
      country: 'Norway',
      heroImage: '/destinations/lofoten/hero.jpg', // adjust if you have a dedicated hero
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

    // Use S3 URL for migrated assets (migrated: hamn-y, haukland-beach, hesten, reinebrigen, ryten, senja, tungeneset)
    const baseLocal = `/destinations/lofoten/${loc.slug}/primary.jpg`
    const s3Map: Record<string, string> = {
      'hamn-y': 'https://desti-images.s3.us-east-2.amazonaws.com/destinations/lofoten/hamn-y/primary.jpg',
      'haukland-beach': 'https://desti-images.s3.us-east-2.amazonaws.com/destinations/lofoten/haukland-beach/primary.jpg',
      'hesten': 'https://desti-images.s3.us-east-2.amazonaws.com/destinations/lofoten/hesten/primary.jpg',
      'reinebrigen': 'https://desti-images.s3.us-east-2.amazonaws.com/destinations/lofoten/reinebrigen/primary.jpg',
      'ryten': 'https://desti-images.s3.us-east-2.amazonaws.com/destinations/lofoten/ryten/primary.jpg',
      'senja': 'https://desti-images.s3.us-east-2.amazonaws.com/destinations/lofoten/senja/primary.jpg',
      'tungeneset': 'https://desti-images.s3.us-east-2.amazonaws.com/destinations/lofoten/tungeneset/primary.jpg',
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

    // Prepare target folder for easy image drop-in / README note
    const folder = path.join(process.cwd(), 'public', 'destinations', 'lofoten', loc.slug)
    await mkdir(folder, { recursive: true })
    const readmePath = path.join(folder, 'README.txt')
    const note = s3Map[loc.slug]
      ? `This location's primary image is served from S3 for deployment size reasons.\nS3 Object: ${url}\n(Local fallback path if needed: ${baseLocal})\n`
      : `Place your image at primary.jpg for ${loc.name}.\nExpected path: ${url}\n`
    await writeFile(readmePath, note)

    // Tiny placeholder if missing primary.jpg locally
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
