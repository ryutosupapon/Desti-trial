#!/usr/bin/env node
/*
  One-off script to add missing Switzerland curated locations with placeholder photos.
  Safe to run multiple times; skips existing by exact name within the destination.
*/

require('dotenv').config()
const path = require('path')
const fs = require('fs')
const fsp = require('fs/promises')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function slugify(s) {
  return (s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

async function ensureFile(filePath) {
  try {
    await fsp.access(filePath)
  } catch {
    await fsp.mkdir(path.dirname(filePath), { recursive: true })
    // Write a tiny valid JPEG placeholder
    const tinyJpegBase64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxISEhUVFRUVFRUVFRUVFRUVFRUVFRUWFxUVFRUYHSggGBolHRUVITEhJSkrLi4uFx8zODMsNygtLisBCgoKDg0OGxAQGy0lICUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAEAAQMBIgACEQEDEQH/xAAbAAABBQEBAAAAAAAAAAAAAAAFAAMEBgcBAv/EADMQAAEDAgQEAwYHAAAAAAAAAAECAwQAEQUSIQYTMUFRFCJxgZGh8CKhQpLB0fAUM1Ny0v/EABkBAAMBAQEAAAAAAAAAAAAAAAABAgMEBf/EACQRAQEAAgIBAwQDAAAAAAAAAAABAhEDBBIhMUFREyJxgZGx/9oADAMBAAIRAxEAPwD0QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//Z'
    const buf = Buffer.from(tinyJpegBase64.replace(/^data:[^,]*,/, ''), 'base64')
    await fsp.writeFile(filePath, buf)
  }
}

async function main() {
  const key = 'switzerland'
  let destination = await prisma.curatedDestination.findFirst({ where: { key, isActive: true } })
  if (!destination) {
    // Create a minimal destination if missing (should already exist)
    destination = await prisma.curatedDestination.upsert({
      where: { key },
      update: { isActive: true },
      create: {
        key,
        name: 'Switzerland',
        description: 'Alpine landscapes, charming villages, valleys and glaciers',
        country: 'Switzerland',
        heroImage: '/destinations/switzerland/hero.jpg',
        isActive: true,
      },
    })
  }

  const items = [
    { name: 'Oeschinensee', locationType: 'lake' },
    { name: 'Saxer Lücke', locationType: 'hiking' },
    { name: 'Wengen', locationType: 'viewpoint' },
    { name: 'Stechelberg', locationType: 'valley' },
  ]

  const publicRoot = path.join(process.cwd(), 'public')
  const created = []
  const skipped = []

  for (const item of items) {
    const exists = await prisma.curatedLocation.findFirst({
      where: { destinationId: destination.id, name: item.name },
    })
    if (exists) {
      skipped.push(item.name)
      continue
    }

    const slug = slugify(item.name)
    const url = `/destinations/${key}/${slug}/primary.jpg`
    await ensureFile(path.join(publicRoot, url.replace(/^\//, '')))

    const loc = await prisma.curatedLocation.create({
      data: {
        destinationId: destination.id,
        name: item.name,
        description: '',
        locationType: item.locationType,
        difficulty: 'easy',
        bestTime: '',
        coordinates: '',
        photos: { create: [{ url, thumbnailUrl: url, altText: item.name, isPrimary: true }] },
      },
      include: { photos: true },
    })
    created.push(loc.name)
  }

  console.log(JSON.stringify({ created, skipped }, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
