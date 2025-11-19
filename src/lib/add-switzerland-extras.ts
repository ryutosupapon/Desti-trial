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

// Assumption: "Oechinenee" intended as Oeschinensee (near Kandersteg)
const extras: NewLoc[] = [
  {
    name: 'Lauterbrunnen',
    slug: 'lauterbrunnen',
    description: 'Iconic valley of 72 waterfalls; gateway to Wengen and Mürren.',
    locationType: 'village',
    difficulty: 'easy',
    bestTime: 'May-Oct',
    coordinates: '46.5931,7.9073',
  },
  {
    name: 'Oeschinensee',
    slug: 'oeschinensee',
    description: 'Turquoise alpine lake above Kandersteg; boat rentals and panoramic trails.',
    locationType: 'lake',
    difficulty: 'moderate',
    bestTime: 'Jun-Oct',
    coordinates: '46.4989,7.7267',
  },
  {
    name: 'Saxer Lücke',
    slug: 'saxer-lucke',
    description: 'Dramatic ridge window in Alpstein range with views towards Fählensee.',
    locationType: 'viewpoint',
    difficulty: 'moderate',
    bestTime: 'May-Oct',
    coordinates: '47.2773,9.4022',
  },
  {
    name: 'Wengen',
    slug: 'wengen',
    description: 'Car-free resort perched above Lauterbrunnen with Jungfrau vistas.',
    locationType: 'village',
    difficulty: 'easy',
    bestTime: 'Year-round',
    coordinates: '46.6056,7.9210',
  },
  {
    name: 'Stechelberg',
    slug: 'stechelberg',
    description: 'Quiet end-of-valley hamlet; cableway to Gimmelwald and Mürren.',
    locationType: 'village',
    difficulty: 'easy',
    bestTime: 'Year-round',
    coordinates: '46.5445,7.8999',
  },
]

async function main() {
  console.log('Adding extra Switzerland locations…')

  const dest = await prisma.curatedDestination.upsert({
    where: { key: 'switzerland' },
    update: { isActive: true },
    create: {
      key: 'switzerland',
      name: 'Switzerland',
      description: 'Alpine peaks, pristine lakes, and storybook valleys',
      country: 'Switzerland',
      heroImage: '/destinations/switzerland/hero.jpg',
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

    const url = `/destinations/switzerland/${loc.slug}/primary.jpg`
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
    const folder = path.join(process.cwd(), 'public', 'destinations', 'switzerland', loc.slug)
    await mkdir(folder, { recursive: true })
    const readmePath = path.join(folder, 'README.txt')
    const note = `Place your image at primary.jpg for ${loc.name}.\nExpected path: ${url}\n`
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
