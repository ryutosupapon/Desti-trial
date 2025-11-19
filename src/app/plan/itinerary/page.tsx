"use client"

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Copy, Share2 } from 'lucide-react'
import { generateShareableLink } from '@/lib/share-utils'
import ShareModal from '@/components/ShareModal'
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Calendar as CalendarIcon,
  Utensils,
  Bed,
  CheckCircle,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'

function ItineraryInner() {
  const searchParams = useSearchParams()
  const tripId = searchParams?.get('tripId') ?? ''
  const [trip, setTrip] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  useEffect(() => {
    if (tripId) fetchTrip()
  }, [tripId])

  const fetchTrip = async () => {
    try {
      if (!tripId) return
      const res = await fetch(`/api/trips/${tripId}`)
      if (res.ok) {
        const current = await res.json()
        setTrip(current)
        return
      }
      // Fallback: try list endpoint if single fetch fails
      const list = await fetch('/api/trips')
      if (list.ok) {
        const trips = await list.json()
        setTrip(trips.find((t: any) => t.id === tripId) || null)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleShare = () => {
    if (!tripId) return
    const link = generateShareableLink(tripId)
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // PDF download removed per request (feature unreliable).
  // If reintroduced, implement server-side PDF generation for reliability.

  if (!trip?.itinerary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p>No itinerary found</p>
            <Link href="/dashboard" className="mt-4 inline-block">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8" id="itinerary-content">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Your {trip.destination} Itinerary</h1>
              <p className="text-gray-600">{trip.itinerary.overview}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowShareModal(true)}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            {/* Download PDF removed */}
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            {trip.itinerary.days.map((day: any) => (
              <Card key={day.day}>
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <CardTitle className="flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    Day {day.day} - {day.theme}
                  </CardTitle>
                  <p className="text-blue-100 text-sm">{day.date}</p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4 mb-6">
                    {day.activities.map((activity: any, i: number) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold mb-2">{activity.activity}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {activity.time}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {activity.location}
                          </span>
                          <Badge variant="secondary">{activity.duration}</Badge>
                        </div>
                        <p className="text-gray-700 text-sm mb-2">{activity.description}</p>
                        {activity.tips && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-2">
                            <p className="text-sm text-blue-800">
                              <strong>Tip:</strong> {activity.tips}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {day.meals?.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3 flex items-center">
                        <Utensils className="h-4 w-4 mr-2" />
                        Meals
                      </h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        {day.meals.map((meal: any, i: number) => (
                          <div key={i} className="p-3 border rounded">
                            <div className="font-medium capitalize">{meal.type}</div>
                            <div className="text-sm text-gray-600">{meal.restaurant}</div>
                            <div className="text-xs text-gray-500">
                              {meal.cuisine} • {meal.priceRange}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {day.accommodation && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center">
                        <Bed className="h-4 w-4 mr-2" />
                        Accommodation
                      </h4>
                      <div className="p-4 border rounded">
                        <div className="font-medium">{day.accommodation.name}</div>
                        <div className="text-sm text-gray-700 mt-2">
                          {day.accommodation.whyRecommended}
                        </div>
                        {day.accommodation.bookingUrl && (
                          <div className="mt-3">
                            <a
                              href={day.accommodation.bookingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                              Book this stay on Booking.com
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                  Budget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 mb-4">
                  €{trip.itinerary.budgetEstimate.perPerson}/day
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Accommodation</span>
                    <span>€{trip.itinerary.budgetEstimate.breakdown.accommodation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Food</span>
                    <span>€{trip.itinerary.budgetEstimate.breakdown.food}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Activities</span>
                    <span>€{trip.itinerary.budgetEstimate.breakdown.activities}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transport</span>
                    <span>€{trip.itinerary.budgetEstimate.breakdown.transportation}</span>
                  </div>
                </div>
              </CardContent>
            </Card>


      {/* Share Modal */}
      {trip && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          tripId={tripId!}
          tripTitle={trip.title}
        />
      )}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Packing List
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {trip.itinerary.packingList.map((item: string, i: number) => (
                    <div key={i} className="flex items-center text-sm">
                      <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Share Modal */}
        {trip && (
          <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            tripId={tripId!}
            tripTitle={trip.title}
          />
        )}
      </div>
    </div>
  )
}

export default function ItineraryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ItineraryInner />
    </Suspense>
  )
}
