import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateTripSchema = z.object({
  title: z.string().min(1).optional(),
  destination: z.string().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  travelers: z.number().min(1).optional(),
  budget: z.number().optional(),
  budgetLevel: z.string().optional(),
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const dbUser = await getOrCreateUserFromSession(session)

    const trip = await prisma.trip.findFirst({
      where: { id, userId: dbUser.id },
      include: {
        selectedPhotos: {
          include: { photo: { include: { location: true } } },
        },
      },
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    return NextResponse.json(trip)
  } catch (error) {
    console.error('Trip GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const dbUser = await getOrCreateUserFromSession(session)
    const body = await request.json()
    const data = updateTripSchema.parse(body)

    const trip = await prisma.trip.findFirst({ where: { id, userId: dbUser.id } })
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const updatedTrip = await prisma.trip.update({
      where: { id },
      data: {
        ...data,
        // Ensure Int type on travelers and normalize dates
        travelers: typeof data.travelers === 'number' ? Math.trunc(data.travelers) : undefined,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    })

    return NextResponse.json(updatedTrip)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Trip PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const dbUser = await getOrCreateUserFromSession(session)

    const trip = await prisma.trip.findFirst({ where: { id, userId: dbUser.id } })
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    await prisma.trip.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Trip DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
