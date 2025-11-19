import { NextRequest, NextResponse } from 'next/server'
import { searchPlaces } from '@/lib/google-places'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ predictions: [] })
  }

  try {
    const predictions = await searchPlaces(query)
    return NextResponse.json({ predictions })
  } catch (error) {
    console.error('Destination search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
