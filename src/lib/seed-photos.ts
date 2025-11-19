import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedPhotoData() {
  console.log('Seeding photo data...')

  // Dolomites destination
  const dolomites = await prisma.curatedDestination.upsert({
    where: { key: 'dolomites' },
    update: {},
    create: {
      key: 'dolomites',
      name: 'Dolomites, Italy',
      description: 'Dramatic limestone peaks, alpine meadows, and stunning mountain vistas',
      country: 'Italy',
      heroImage: '/destinations/dolomites/hero.jpg',
      isActive: true,
    },
  })

  // Lago di Braies
  await prisma.curatedLocation.create({
    data: {
      destinationId: dolomites.id,
      name: 'Lago di Braies',
      description: 'Crystal-clear turquoise lake surrounded by dramatic Dolomite peaks',
      locationType: 'lake',
      difficulty: 'easy',
      bestTime: 'Jun-Sep',
      coordinates: '46.6943,12.0856',
      photos: {
        create: [
          {
            url: '/destinations/dolomites/lago-di-braies/primary.jpg',
            thumbnailUrl: '/destinations/dolomites/lago-di-braies/primary.jpg',
            altText: 'Lago di Braies with turquoise waters and mountain reflections',
            isPrimary: true,
          },
          {
            url: '/destinations/dolomites/lago-di-braies/secondary.jpg',
            thumbnailUrl: '/destinations/dolomites/lago-di-braies/secondary.jpg',
            altText: 'Wooden boats on Lago di Braies at sunrise',
            isPrimary: false,
          },
        ],
      },
    },
  })

  // Tre Cime di Lavaredo
  await prisma.curatedLocation.create({
    data: {
      destinationId: dolomites.id,
      name: 'Tre Cime di Lavaredo',
      description:
        'Iconic three-peaked mountain formation, one of the most famous landmarks in the Dolomites',
      locationType: 'mountain',
      difficulty: 'moderate',
      bestTime: 'Jul-Sep',
      coordinates: '46.6186,12.3022',
      photos: {
        create: [
          {
            url: '/destinations/dolomites/tre-cime/primary.jpg',
            thumbnailUrl: '/destinations/dolomites/tre-cime/primary.jpg',
            altText: 'Tre Cime di Lavaredo at golden hour',
            isPrimary: true,
          },
        ],
      },
    },
  })

  // Seceda Ridge
  await prisma.curatedLocation.create({
    data: {
      destinationId: dolomites.id,
      name: 'Seceda Ridge',
      description: 'Dramatic ridge with sweeping views and rolling alpine meadows',
      locationType: 'viewpoint',
      difficulty: 'moderate',
      bestTime: 'Jun-Oct',
      coordinates: '46.6008,11.7297',
      photos: {
        create: [
          {
            url: '/destinations/dolomites/seceda/primary.jpg',
            thumbnailUrl: '/destinations/dolomites/seceda/primary.jpg',
            altText: 'Seceda Ridge with dramatic mountain peaks',
            isPrimary: true,
          },
        ],
      },
    },
  })

  // Alpe di Siusi (Alpe di Suisi)
  const existingAlpe = await prisma.curatedLocation.findFirst({
    where: { destinationId: dolomites.id, name: 'Alpe di Siusi' },
  })
  if (!existingAlpe) {
    await prisma.curatedLocation.create({
      data: {
        destinationId: dolomites.id,
        name: 'Alpe di Siusi',
        description:
          'Europe\'s largest high-altitude alpine meadow, gentle rolling hills and panoramic mountain views',
        locationType: 'meadow',
        difficulty: 'easy',
        bestTime: 'May-Oct',
        coordinates: '46.5620,11.6400',
        photos: {
          create: [
            {
              url: '/destinations/dolomites/alpe-di-siusi/primary.jpg',
              thumbnailUrl: '/destinations/dolomites/alpe-di-siusi/primary.jpg',
              altText: 'Cabins on Alpe di Siusi meadow at sunrise',
              isPrimary: true,
            },
          ],
        },
      },
    })
  }

  // Switzerland destination
  const switzerland = await prisma.curatedDestination.upsert({
    where: { key: 'switzerland' },
    update: {},
    create: {
      key: 'switzerland',
      name: 'Switzerland',
      description: 'Alpine landscapes, charming villages, valleys and glaciers',
      country: 'Switzerland',
      heroImage: '/destinations/switzerland/hero.jpg',
      isActive: true,
    },
  })

  // Lauterbrunnen Valley
  await prisma.curatedLocation.create({
    data: {
      destinationId: switzerland.id,
      name: 'Lauterbrunnen Valley',
      description: 'Picturesque valley with towering cliffs and waterfalls',
      locationType: 'valley',
      difficulty: 'easy',
      bestTime: 'May-Oct',
      coordinates: '46.5933,7.9099',
      photos: {
        create: [
          {
            url: '/destinations/switzerland/lauterbrunnen/primary.jpg',
            thumbnailUrl: '/destinations/switzerland/lauterbrunnen/primary.jpg',
            altText: 'Lauterbrunnen Valley with waterfalls and green meadows',
            isPrimary: true,
          },
        ],
      },
    },
  })

  // Matterhorn Viewpoint
  await prisma.curatedLocation.create({
    data: {
      destinationId: switzerland.id,
      name: 'Matterhorn Viewpoint',
      description: 'Iconic pyramid-shaped peak dominating the skyline',
      locationType: 'mountain',
      difficulty: 'moderate',
      bestTime: 'Jun-Sep',
      coordinates: '45.9763,7.6586',
      photos: {
        create: [
          {
            url: '/destinations/switzerland/matterhorn/primary.jpg',
            thumbnailUrl: '/destinations/switzerland/matterhorn/primary.jpg',
            altText: 'Matterhorn at sunrise with alpenglow',
            isPrimary: true,
          },
        ],
      },
    },
  })

  // Lofoten destination
  const lofoten = await prisma.curatedDestination.upsert({
    where: { key: 'lofoten' },
    update: {},
    create: {
      key: 'lofoten',
      name: 'Lofoten',
      description: 'Dramatic fjords, fishing villages, and Arctic beaches in Norway',
      country: 'Norway',
      heroImage: '/destinations/lofoten/hero.jpg',
      isActive: true,
    },
  })

  // Reinebringen
  await prisma.curatedLocation.create({
    data: {
      destinationId: lofoten.id,
      name: 'Reinebringen',
      description: 'Steep hike to a breathtaking view over Reinefjorden and surrounding peaks',
      locationType: 'viewpoint',
      difficulty: 'difficult',
      bestTime: 'Jun-Sep',
      coordinates: '67.9250,13.0890',
      photos: {
        create: [
          {
            url: '/destinations/lofoten/reinebringen/primary.jpg',
            thumbnailUrl: '/destinations/lofoten/reinebringen/primary.jpg',
            altText: 'View from Reinebringen over the fjords',
            isPrimary: true,
          },
        ],
      },
    },
  })

  // Haukland Beach
  await prisma.curatedLocation.create({
    data: {
      destinationId: lofoten.id,
      name: 'Haukland Beach',
      description: 'White-sand Arctic beach with turquoise waters and mountain backdrop',
      locationType: 'beach',
      difficulty: 'easy',
      bestTime: 'Jun-Aug',
      coordinates: '68.2089,13.5425',
      photos: {
        create: [
          {
            url: '/destinations/lofoten/haukland-beach/primary.jpg',
            thumbnailUrl: '/destinations/lofoten/haukland-beach/primary.jpg',
            altText: 'Haukland Beach with turquoise waters',
            isPrimary: true,
          },
        ],
      },
    },
  })

  console.log('Photo data seeded successfully!')
}

seedPhotoData()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
