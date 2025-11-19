import { prisma } from '../src/lib/db'
import path from 'path'
import { rm } from 'fs/promises'

function slugify(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

async function main() {
  const [key, name] = process.argv.slice(2)
  if (!key || !name) {
    console.error('Usage: tsx scripts/delete-curated-location.ts <destinationKey> <locationName>')
    process.exit(1)
  }

  const dest = await prisma.curatedDestination.findFirst({ where: { key } })
  if (!dest) {
    console.error(`Destination not found: ${key}`)
    process.exit(2)
  }

  const loc = await prisma.curatedLocation.findFirst({ where: { destinationId: dest.id, name } })
  if (!loc) {
    console.error(`Location not found: ${name}`)
    process.exit(3)
  }

  // Delete photos first
  await prisma.curatedPhoto.deleteMany({ where: { locationId: loc.id } })
  // Delete the location
  await prisma.curatedLocation.delete({ where: { id: loc.id } })

  // Remove public files folder if present
  const slug = slugify(name)
  const folder = path.join(process.cwd(), 'public', 'destinations', key, slug)
  try {
    await rm(folder, { recursive: true, force: true })
    console.log(`Deleted folder: ${folder}`)
  } catch (e) {
    // ignore
  }

  console.log(`Deleted curated location '${name}' under destination '${key}'.`)
}

main().finally(async () => {
  await prisma.$disconnect()
})
