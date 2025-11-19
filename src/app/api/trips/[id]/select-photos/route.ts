import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const selectPhotosSchema = z.object({
  photoIds: z.array(z.string()).min(1),
})

async function getOrCreateUserFromSession(session: any) {
  const sessionUser = session?.user || {}
  const sessionId = (sessionUser as any)?.id as string | undefined
  const email = sessionUser?.email as string | undefined

  if (sessionId) {
    const byId = await prisma.user.findUnique({ where: { id: sessionId } })
    if (byId) return byId
  }
  if (email) {
    const byEmail = await prisma.user.findUnique({ where: { email } })
    if (byEmail) return byEmail
  }
  if (email) {
    return prisma.user.create({
      data: {
        email,
        name: sessionUser?.name || null,
        image: sessionUser?.image || null,
      },
    })
  }
  throw new Error('No valid user in session; please sign in again')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await getOrCreateUserFromSession(session)

    const body = await request.json()
    const { photoIds } = selectPhotosSchema.parse(body)

    // Verify trip ownership
    const trip = await prisma.trip.findFirst({
      where: {
        id,
        userId: dbUser.id,
      },
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Delete existing selections
    await prisma.photoSelection.deleteMany({
      where: { tripId: id },
    })

    // Create new selections
    const selections = await Promise.all(
      photoIds.map(async (photoId) => {
        const photo = await prisma.curatedPhoto.findUnique({
          where: { id: photoId },
        })

        if (!photo) throw new Error(`Photo ${photoId} not found`)

        return prisma.photoSelection.create({
          data: {
            tripId: id,
            locationId: photo.locationId,
            photoId: photoId,
          },
        })
      })
    )

    // Update trip status
    await prisma.trip.update({
      where: { id },
      data: { status: 'photos_selected' },
    })

    return NextResponse.json({ success: true, count: selections.length })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Select photos error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
