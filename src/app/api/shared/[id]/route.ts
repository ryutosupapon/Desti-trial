import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        selectedPhotos: {
          include: {
            photo: {
              include: {
                location: true,
              },
            },
          },
        },
      },
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    if (!trip.itinerary) {
      return NextResponse.json({ error: 'No itinerary available' }, { status: 404 })
    }

    return NextResponse.json({
      id: trip.id,
      title: trip.title,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      travelers: trip.travelers,
      budgetLevel: (trip as any).budgetLevel,
      itinerary: trip.itinerary,
      creator: {
        name: trip.user?.name ?? null,
        image: trip.user?.image ?? null,
      },
      selectedPhotos: trip.selectedPhotos.map((sel: any) => ({
        location: sel.photo.location.name,
        type: sel.photo.location.locationType,
      })),
      createdAt: trip.createdAt,
    })
  } catch (error) {
    console.error('Public share fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
