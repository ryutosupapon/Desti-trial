import { prisma } from '../src/lib/db'

async function main() {
  const [id] = process.argv.slice(2)
  if (!id) {
    console.error('Usage: tsx scripts/delete-curated-location-by-id.ts <locationId>')
    process.exit(1)
  }
  const loc = await prisma.curatedLocation.findUnique({ where: { id }, include: { photos: true } })
  if (!loc) {
    console.error('Location not found:', id)
    process.exit(2)
  }

  const photoIds = loc.photos.map(p => p.id)

  // Remove any selections that reference this location or its photos
  await prisma.photoSelection.deleteMany({ where: { OR: [ { locationId: id }, { photoId: { in: photoIds } } ] } })
  // Delete photos next
  await prisma.curatedPhoto.deleteMany({ where: { locationId: id } })
  // Finally delete the location
  await prisma.curatedLocation.delete({ where: { id } })

  console.log('Deleted curated location by id:', id, 'name:', loc.name)
}

main().finally(async () => prisma.$disconnect())
