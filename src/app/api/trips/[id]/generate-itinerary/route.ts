import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import OpenAI from 'openai'

function buildBookingUrl(opts: {
  destination?: string | null
  startDate?: string | Date | null
  endDate?: string | Date | null
  adults?: number | null
  hotelName?: string | null
}) {
  const base = 'https://www.booking.com/searchresults.html'
  const dest = (opts.hotelName && String(opts.hotelName).trim()) || (opts.destination && String(opts.destination).trim()) || ''
  const ss = encodeURIComponent(dest)
  // Handle date inputs that might be Date or string
  const start = opts.startDate ? new Date(opts.startDate) : null
  const end = opts.endDate ? new Date(opts.endDate) : null
  const checkin = start ? start.toISOString().slice(0, 10) : ''
  const checkout = end ? end.toISOString().slice(0, 10) : ''
  const adults = Math.max(1, Number(opts.adults || 2))
  const params = new URLSearchParams({ ss, group_adults: String(adults), no_rooms: '1' })
  if (checkin) params.set('checkin', checkin)
  if (checkout) params.set('checkout', checkout)
  return `${base}?${params.toString()}`
}

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || /YOUR_OPENAI_KEY_HERE/i.test(apiKey)) return null
  return new OpenAI({ apiKey })
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

    const dbUser = await getOrCreateUserFromSession(session)

    const openai = getOpenAI()
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API key missing or placeholder. Set OPENAI_API_KEY in .env.local (never commit real key) then restart.' },
        { status: 500 }
      )
    }

    const trip = await prisma.trip.findFirst({
      where: { id, userId: dbUser.id },
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const selectedPhotos = await (prisma as any).photoSelection.findMany({
      where: { tripId: id },
      include: { photo: { include: { location: true } } },
    })

    if (!selectedPhotos || selectedPhotos.length === 0) {
      return NextResponse.json({ error: 'No photos selected' }, { status: 400 })
    }

  const itinerary = await generateItinerary({ ...trip, selectedPhotos }, openai)

    // Inject Booking.com links for each day based on accommodation name and trip dates
    try {
      if (itinerary?.days && Array.isArray(itinerary.days)) {
        itinerary.days = itinerary.days.map((d: any) => {
          const hotelName = d?.accommodation?.name || d?.accommodation?.suggestedHotelName || null
          const bookingUrl = buildBookingUrl({
            destination: trip.destination,
            startDate: trip.startDate,
            endDate: trip.endDate,
            adults: (trip as any).travelers || (trip as any).numTravelers || 2,
            hotelName,
          })
          return {
            ...d,
            accommodation: d?.accommodation
              ? { ...d.accommodation, bookingUrl }
              : { name: hotelName || trip.destination, bookingUrl },
          }
        })
      }
    } catch (e) {
      // Non-fatal: if anything goes wrong building URLs, continue without links
      console.warn('Booking URL injection skipped:', (e as any)?.message || e)
    }

    await prisma.trip.update({
      where: { id },
      data: {
        itinerary,
        status: 'itinerary_ready',
      },
    })

    return NextResponse.json({ success: true, itinerary })
  } catch (error: any) {
    console.error('Generate itinerary error:', error)
    const message = error?.message || 'Failed to generate'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function generateItinerary(trip: any, openai: OpenAI) {
  const selectedLocations = trip.selectedPhotos.map((selection: any) => ({
    name: selection.photo.location.name,
    type: selection.photo.location.locationType,
    difficulty: selection.photo.location.difficulty,
    bestTime: selection.photo.location.bestTime,
  }))

  const tripDuration = Math.ceil(
    (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  )

  const prompt = `Create a ${tripDuration}-day itinerary for ${trip.destination} based on these locations:

${selectedLocations
  .map((loc: any) => `- ${loc.name} (${loc.type}, ${loc.difficulty})`)
  .join('\n')}

Trip: ${tripDuration} days, ${trip.travelers} travelers, ${trip.budgetLevel} budget
Total numeric trip budget (all travelers combined): ${typeof trip.budget === 'number' ? `€${trip.budget}` : 'unknown'}
Start: ${new Date(trip.startDate).toLocaleDateString()}

Include ALL locations, optimize order, add meals, accommodation, transportation.

Budget rules (IMPORTANT – compute dynamically, do not copy example values):
- If total budget is provided, set per-person-per-day budget as: perPerson = round(totalBudget / ${trip.travelers} / ${tripDuration}).
- If total budget is unknown, infer realistic daily per-person values for ${trip.destination} and adjust by budget level (${trip.budgetLevel}).
- Provide daily per-person numbers in euros; breakdown values must sum approximately to perPerson.
- Adjust proportions by budgetLevel: budget → lower accommodation share; luxury → higher accommodation share.

Return JSON ONLY (no markdown, no backticks, no explanations). The response must be a single valid JSON object matching exactly this shape (values below are examples only – compute your own numbers):
{
  "overview": "Brief summary",
  "days": [
    {
      "day": 1,
      "date": "2024-01-15",
      "theme": "Theme",
      "activities": [
        {
          "time": "08:00",
          "activity": "Activity",
          "location": "Location",
          "duration": "2 hours",
          "description": "Description",
          "tips": "Tips"
        }
      ],
      "meals": [
        {
          "type": "lunch",
          "restaurant": "Name",
          "cuisine": "Type",
          "priceRange": "€€"
        }
      ],
      "accommodation": {
        "name": "Hotel",
        "type": "Type",
        "whyRecommended": "Reason"
      }
    }
  ],
  "packingList": ["items"],
  "budgetEstimate": {
    "perPerson": 123,
    "breakdown": {
      "accommodation": 50,
      "food": 35,
      "activities": 25,
      "transportation": 13
    }
  }
}`

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content:
          'You are a travel planner. Output only strict JSON without code fences or extra text.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 4000,
    response_format: { type: 'json_object' as any },
  })

  const choice = completion.choices[0]
  const content = choice?.message?.content
  if (!content) {
    const finish = (choice as any)?.finish_reason || 'unknown'
    throw new Error('No response from model (finish_reason=' + finish + ')')
  }

  try {
    return safeParseJSON(content)
  } catch (e: any) {
    // Surface parse errors with a helpful hint
    throw new Error('Model returned non-JSON. Try again or adjust prompt/model. Details: ' + (e?.message || 'invalid JSON'))
  }
}

function safeParseJSON(raw: string) {
  // Try direct parse first
  try {
    return JSON.parse(raw)
  } catch {}

  // Try fenced code block ```json ... ``` or ``` ... ```
  const fenceJson = raw.match(/```json\s*([\s\S]*?)\s*```/i)
  if (fenceJson && fenceJson[1]) {
    try { return JSON.parse(fenceJson[1]) } catch {}
  }
  const fence = raw.match(/```\s*([\s\S]*?)\s*```/)
  if (fence && fence[1]) {
    try { return JSON.parse(fence[1]) } catch {}
  }

  // Try extracting the first top-level JSON object by braces
  const firstBrace = raw.indexOf('{')
  const lastBrace = raw.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = raw.slice(firstBrace, lastBrace + 1)
    try { return JSON.parse(candidate) } catch {}
  }

  throw new Error('Unable to parse JSON from model output')
}
