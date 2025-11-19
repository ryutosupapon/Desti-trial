"use client"

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Wand2, MapPin, Clock, Users } from 'lucide-react'
import Link from 'next/link'

function GenerateInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tripId = searchParams?.get('tripId') ?? ''
  
  const [trip, setTrip] = useState<any>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTrip()
  }, [tripId])

  const fetchTrip = async () => {
    try {
      const res = await fetch('/api/trips')
      const trips = await res.json()
      let current = Array.isArray(trips) ? trips.find((t: any) => t.id === tripId) : null

      // Fallback if trip id is stale or missing (e.g., DB reset)
      if (!current) {
        if (Array.isArray(trips) && trips.length > 0) {
          current = trips[0]
          // Normalize URL so subsequent steps carry the valid id
          router.replace(`/plan/generate?tripId=${current.id}`)
        } else {
          // No trips exist – guide user to create one
          router.replace('/plan')
          return
        }
      }

      setTrip(current)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const generateItinerary = async () => {
    setGenerating(true)
    setError('')

    try {
      const response = await fetch(`/api/trips/${tripId}/generate-itinerary`, {
        method: 'POST',
      })

      if (response.ok) {
        router.push(`/plan/itinerary?tripId=${tripId}`)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed')
      }
    } catch (error) {
      setError('Network error')
    } finally {
      setGenerating(false)
    }
  }

  if (!trip) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  const duration = Math.ceil(
    (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 
    (1000 * 60 * 60 * 24)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-2">Generate Your Itinerary</h1>
        <p className="text-gray-600 mb-8">AI will create a plan based on your photos</p>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Trip Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {trip.destination}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {duration} days
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    {trip.travelers} travelers
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Selected Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {trip.selectedPhotos?.map((sel: any, i: number) => (
                    <div key={i} className="p-3 bg-gray-50 rounded">
                      <div className="font-medium">{sel.photo?.location?.name || 'Location'}</div>
                      <div className="text-sm text-gray-500">{sel.photo?.location?.locationType}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wand2 className="h-5 w-5 mr-2" />
                  AI Generator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2"></div>
                    Day-by-day schedule
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2"></div>
                    Optimized routes
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2"></div>
                    Accommodations
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2"></div>
                    Restaurants
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2"></div>
                    Budget breakdown
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 rounded">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <Button 
                  onClick={generateItinerary}
                  disabled={generating}
                  className="w-full"
                  size="lg"
                >
                  {generating ? 'Generating...' : 'Generate Itinerary'}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Takes 30-60 seconds
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <GenerateInner />
    </Suspense>
  )
}
