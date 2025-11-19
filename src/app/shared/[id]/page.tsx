"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, Calendar as CalendarIcon, Users, DollarSign, CheckCircle, Utensils, Bed, Copy, ExternalLink } from 'lucide-react'
import Link from 'next/link'
// Download PDF removed; no longer importing PDF utilities

export default function SharedItineraryPage() {
  const params = useParams<{ id: string }>()
  const id = (params && typeof params.id === 'string') ? params.id : ''
  const [trip, setTrip] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (id) fetchTrip()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchTrip = async () => {
    try {
      const res = await fetch(`/api/shared/${id}`)
      if (res.ok) {
        const data = await res.json()
        setTrip(data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // PDF download removed per request

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h3 className="font-semibold mb-2">Itinerary Not Found</h3>
            <p className="text-gray-600 mb-4">This trip may be private or no longer available</p>
            <Link href="/">
              <Button>Go to Homepage</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const duration = Math.ceil(
    (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/" className="font-bold text-xl text-blue-600">
                Desti
              </Link>
              <Badge variant="outline">Shared Itinerary</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-2" />
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
              {/* Download PDF removed */}
              <Link href="/auth/signin">
                <Button size="sm">
                  Create Your Own
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8" id="itinerary-content">
        {/* Trip Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-8 mb-8">
          <h1 className="text-4xl font-bold mb-2">{trip.destination}</h1>
          <p className="text-blue-100 mb-4">{trip.itinerary.overview}</p>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {duration} days
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              {trip.travelers} travelers
            </div>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              {trip.budgetLevel}
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm opacity-75">
            <span>Created by {trip.creator.name}</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Days */}
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
                  {/* Activities */}
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

                  {/* Meals */}
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

                  {/* Accommodation */}
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
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sidebar */}
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

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="font-semibold mb-2">Love this itinerary?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Create your own personalized travel plans with AI
                  </p>
                  <Link href="/auth/signin">
                    <Button className="w-full">
                      Get Started Free
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
