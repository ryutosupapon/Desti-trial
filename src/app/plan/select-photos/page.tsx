"use client"

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import PhotoCard from '@/components/PhotoCard'
import LocationFilters from '@/components/LocationFilters'
import { ArrowLeft, Camera, Sparkles } from 'lucide-react'
import Link from 'next/link'

function SelectPhotosInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const tripId = searchParams?.get('tripId') ?? ''

  const [trip, setTrip] = useState<any>(null)
  const [locations, setLocations] = useState<any[]>([])
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([])
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
    if (status === 'authenticated') {
      fetchData()
    }
  }, [status, tripId])

  function toDestinationKey(name: string): string {
    const n = (name || '').toLowerCase().trim()
    // Robust mapping for our three curated sets
    if (n.includes('dolomites') || n.includes('dolomite') || n.includes('dolomiti')) return 'dolomites'
    if (n.includes('switzerland') || n.includes('swiss')) return 'switzerland'
    if (n.includes('lofoten') || n.includes('norway') || n.includes('norwegian')) return 'lofoten'
    // Fallback: slugify first token
    const base = n.split(',')[0].trim()
    return base.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  }

  // Create a slug for element ids from a human name (handles accents like Værøy)
  function slugifyName(name: string) {
    return (name || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // strip diacritics
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  // Lofoten quick-pick spots requested
  const LOFOTEN_SPOTS = [
    'Værøy',
    'Reinebrigen',
    'Hamnøy',
    'Horseid',
    'Ryten',
    'Senja',
    'Hesten',
    'Tungeneset',
  ]

  const [highlightLocId, setHighlightLocId] = useState<string | null>(null)

  function scrollToSpot(name: string) {
    const id = `loc-${slugifyName(name)}`
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setHighlightLocId(id)
      // remove highlight after a short delay
      setTimeout(() => setHighlightLocId((curr) => (curr === id ? null : curr)), 1500)
    }
  }

  const fetchData = async () => {
    try {
      // Prefer fetching only the requested trip to reduce payload and DB work
      let currentTrip: any = null
      if (tripId) {
        const oneTripRes = await fetch(`/api/trips/${tripId}`)
        if (oneTripRes.status === 401) {
          router.push('/auth/signin')
          return
        }
        if (oneTripRes.ok) {
          currentTrip = await oneTripRes.json()
        }
      }

      // Fallback: fetch list only if single fetch failed or no tripId
      if (!currentTrip) {
        const tripRes = await fetch('/api/trips')
        if (tripRes.status === 401) {
          router.push('/auth/signin')
          return
        }
        const tripsJson = await tripRes.json().catch(() => [])
        const trips = Array.isArray(tripsJson) ? tripsJson : []
        currentTrip = tripId ? trips.find((t: any) => t.id === tripId) : trips[0]
        if (!currentTrip) {
          router.replace('/plan')
          return
        }
        if (!tripId) {
          router.replace(`/plan/select-photos?tripId=${currentTrip.id}`)
        }
      }

      setTrip(currentTrip)

      // Fetch curated locations by derived key from destination
      if (currentTrip) {
        const key = toDestinationKey(currentTrip.destination)
        try {
          const locRes = await fetch(`/api/destinations/${key}/locations`)
          if (locRes.ok) {
            const data = await locRes.json().catch(() => ({ locations: [] }))
            setLocations(Array.isArray(data.locations) ? data.locations : [])
          } else {
            console.warn('Curated locations fetch failed for key:', key, locRes.status)
            setLocations([])
          }
        } catch (e) {
          console.error('Curated locations fetch error for key:', key, e)
          setLocations([])
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredLocations = selectedFilter === 'all'
    ? locations
    : locations.filter((loc) => loc.locationType === selectedFilter)

  // De-duplicate locations by name (case-insensitive) and show one card per unique location
  const uniqueByName = filteredLocations.reduce((acc: Record<string, any>, loc: any) => {
    const keyName = (loc.name || '').toString().toLowerCase().trim()
    if (!keyName) return acc
    if (!acc[keyName]) acc[keyName] = loc
    return acc
  }, {} as Record<string, any>)

  const uniqueLocations = Object.values(uniqueByName) as any[]

  // Show exactly one card per unique location, using its primary photo (or first available)
  const cards = uniqueLocations
    .map((location) => {
      const primary = Array.isArray(location.photos)
        ? (location.photos.find((p: any) => p.isPrimary) || location.photos[0])
        : undefined
      return primary ? { location, photo: primary } : null
    })
    .filter(Boolean) as Array<{ location: any; photo: any }>

  const locationCounts = locations.reduce((acc: Record<string, number>, loc: any) => {
    acc[loc.locationType] = (acc[loc.locationType] || 0) + 1
    acc.all = (acc.all || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const handleSave = async () => {
    if (selectedPhotoIds.length === 0) {
      alert('Please select at least one photo')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/trips/${tripId}/select-photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoIds: selectedPhotoIds }),
      })

  if (!response.ok) throw new Error('Failed to save')

  router.push(`/plan/generate?tripId=${tripId}`)
    } catch (error) {
      console.error('Error saving:', error)
      alert('Failed to save selections')
    } finally {
      setIsSaving(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return <div className="max-w-6xl mx-auto p-8">Loading...</div>
  }

  if (!trip) {
    return <div className="max-w-6xl mx-auto p-8">Loading trip…</div>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>

        <div className="text-center mt-4">
          <h1 className="text-3xl font-bold mb-2">Choose Your Scenic Inspiration</h1>
          <p className="text-gray-600 mb-4">
            Select photos of locations you'd like to visit in{' '}
            <span className="font-medium text-blue-600">{trip.destination}</span>
          </p>

          {/* Helper link to quickly replace curated images for this destination */}
          <div className="text-xs text-gray-500">
            <Link href={`/destinations/${toDestinationKey(trip.destination)}/upload`} className="underline">
              Replace curated photos for this destination
            </Link>
          </div>

          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Camera className="h-4 w-4 mr-1" />
              {selectedPhotoIds.length} selected
            </div>
            <Badge variant="outline">
              {trip.travelers} traveler{trip.travelers > 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </div>

      {locations.length > 0 && (
        <>
          {/* Quick-pick list intentionally omitted based on requirements */}
          <LocationFilters
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
            locationCounts={locationCounts}
          />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 mt-6">
            {cards.map(({ location, photo }) => {
              const locId = `loc-${slugifyName(location?.name || '')}`
              const isHighlighted = highlightLocId === locId
              return (
                <div
                  key={photo.id}
                  id={locId}
                  className={isHighlighted ? 'ring-2 ring-blue-400 rounded-lg transition-shadow' : ''}
                >
                  <PhotoCard
                    location={location}
                    photo={photo}
                    isSelected={selectedPhotoIds.includes(photo.id)}
                    onToggle={(photoId) => {
                      setSelectedPhotoIds((prev) =>
                        prev.includes(photoId)
                          ? prev.filter((id) => id !== photoId)
                          : [...prev, photoId]
                      )
                    }}
                  />
                </div>
              )
            })}
          </div>

          {selectedPhotoIds.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t p-4 shadow-lg">
              <div className="max-w-6xl mx-auto flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <strong>{selectedPhotoIds.length}</strong> photo{selectedPhotoIds.length > 1 ? 's' : ''} selected
                </div>
                <Button onClick={handleSave} disabled={isSaving} size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600">
                  <Sparkles className="h-5 w-5 mr-2" />
                  {isSaving ? 'Saving...' : 'Continue to Summary'}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {locations.length === 0 && (
        <div>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-700 font-medium">No curated locations found yet for this destination.</p>
              <p className="text-gray-500 text-sm mt-1">Showing placeholders while content loads in.</p>
              <div className="mt-3 text-sm">
                <Link href={`/destinations/${toDestinationKey(trip.destination)}/upload`} className="text-blue-600 underline">Upload your own photos now</Link>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 mt-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="relative overflow-hidden rounded-lg border bg-gray-100">
                <div className="aspect-square w-full animate-pulse bg-gradient-to-br from-gray-200 to-gray-300" />
                <div className="p-2">
                  <div className="h-3 w-1/2 bg-gray-200 rounded mb-1 animate-pulse" />
                  <div className="h-3 w-1/3 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="absolute inset-0 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function SelectPhotosPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto p-8">Loading...</div>}>
      <SelectPhotosInner />
    </Suspense>
  )
}
