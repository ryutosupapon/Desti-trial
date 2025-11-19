import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

async function getOrCreateUserFromSession(session: any) {
  const sessionUser = session?.user || {}
  const sessionId = (sessionUser as any)?.id as string | undefined
  const email = sessionUser?.email as string | undefined

  // Try by id first
  if (sessionId) {
    const byId = await prisma.user.findUnique({ where: { id: sessionId } })
    if (byId) return byId
  }

  // Try by email
  if (email) {
    const byEmail = await prisma.user.findUnique({ where: { email } })
    if (byEmail) return byEmail
  }

  // As a last resort, create a minimal user if we have an email
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

const createTripSchema = z.object({
  title: z.string().min(1, 'Trip title is required'),
  destination: z.string().min(1, 'Destination is required'),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  travelers: z.number().int('Travelers must be a whole number').min(1).max(20),
  // Accept optional budget and gracefully handle null coming from JSON (e.g., NaN -> null)
  budget: z
    .number()
    .int('Budget must be a whole number')
    .optional()
    .nullable()
    .transform((v) => (v == null ? undefined : v)),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Resolve the actual DB user in case the DB was reset while the session persisted
    const dbUser = await getOrCreateUserFromSession(session)

    const trips = await prisma.trip.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: 'desc' },
      // No relation includes; itinerary is a JSON field on Trip
    })

    // Attach selectedPhotos with nested photo.location for use in dashboard and generate page
    const tripIds = trips.map((t) => t.id)
    const selections = tripIds.length
      ? await (prisma as any).photoSelection.findMany({
          where: { tripId: { in: tripIds } },
          include: { photo: { include: { location: true } } },
        })
      : []

    const byTrip: Record<string, any[]> = {}
    for (const sel of selections) {
      if (!byTrip[sel.tripId]) byTrip[sel.tripId] = []
      byTrip[sel.tripId].push(sel)
    }

    const enriched = trips.map((t: any) => ({
      ...t,
      selectedPhotos: byTrip[t.id] || [],
    }))

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Get trips error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createTripSchema.parse(body)

    // Extra guards: ensure dates are valid and endDate >= startDate
    if (isNaN((validatedData.startDate as any).getTime()) || isNaN((validatedData.endDate as any).getTime())) {
      return NextResponse.json(
        { error: 'Invalid data', details: 'Start/end date is invalid' },
        { status: 400 }
      )
    }
    if ((validatedData.endDate as any).getTime() < (validatedData.startDate as any).getTime()) {
      return NextResponse.json(
        { error: 'Invalid data', details: 'End date must be after start date' },
        { status: 400 }
      )
    }

    const { title, destination, travelers, startDate, endDate, budget } = validatedData

  // Coerce any numeric drift (safety): ensure integers for Int fields
  const safeTravelers = Math.trunc(travelers)
  const safeBudget = typeof budget === 'number' ? Math.trunc(budget) : undefined

    // Ensure the user exists in DB (DB might have been reset while session persisted)
    const dbUser = await getOrCreateUserFromSession(session)

    const trip = await prisma.trip.create({
      data: {
        title,
        destination,
        travelers: safeTravelers,
        startDate,
        endDate,
        budget: safeBudget,
        // Directly set the foreign key to avoid nested connect failures
        userId: dbUser.id,
      },
    })

    return NextResponse.json(trip)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      )
    }

    // Log full error server-side and surface helpful message in dev
    console.error('Create trip error:', error)
    const isDev = process.env.NODE_ENV !== 'production'
    const code = (error && (error as any).code) || undefined
    const meta = (error && (error as any).meta) || undefined
    const message = (error && (error as any).message) || 'Internal server error'
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(isDev && { details: message, code, meta }),
      },
      { status: 500 }
    )
  }
}
