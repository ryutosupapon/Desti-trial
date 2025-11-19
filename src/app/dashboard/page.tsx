"use client"

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, MapPin } from 'lucide-react'
import TripCard from '@/components/TripCard'
import TripFilters, { TripFiltersState } from '@/components/TripFilters'

interface Trip {
  id: string
  title: string
  destination: string
  startDate: string
  endDate: string
  travelers: number
  budget?: number | null
  status: string
  createdAt: string
  itinerary?: { id?: string } | null
  selectedPhotos?: any[]
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<TripFiltersState>({
    query: '',
    destination: 'All',
    status: 'All',
    sort: 'startDate-desc',
  })
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }

    if (status === 'authenticated') {
      fetchTrips()
    }
  }, [status])

  const fetchTrips = async () => {
    try {
      const response = await fetch('/api/trips')
      if (response.ok) {
        const data = await response.json()
        setTrips(data)
      }
    } catch (error) {
      console.error('Error fetching trips:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = (id: string) => {
    setTrips((prev) => prev.filter((t) => t.id !== id))
  }

  const handleUpdated = (updated: any) => {
    setTrips((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)))
  }

  const filteredTrips = useMemo(() => {
    const q = (filters.query || '').trim().toLowerCase()
    const dest = filters.destination
    const stat = filters.status
    const safeLower = (v: unknown) => (typeof v === 'string' ? v.toLowerCase() : '')

    const normalizeStatus = (t: Trip) => {
      const s = (t.status || '').toLowerCase()
      if (s.includes('itinerary') || s === 'itinerary_ready' || t.itinerary) return 'itinerary_ready'
      if (s.includes('photo') || s === 'photos_selected' || (t.selectedPhotos && t.selectedPhotos.length > 0)) return 'photos_selected'
      return 'planning'
    }

    let arr = trips.filter((t) => {
      const title = typeof t.title === 'string' ? t.title : ''
      const destination = typeof t.destination === 'string' ? t.destination : ''
      const matchQuery = !q || safeLower(title).includes(q) || safeLower(destination).includes(q)
      const matchDest = dest === 'All' || destination === dest
      const matchStatus = stat === 'All' || normalizeStatus(t) === stat
      return matchQuery && matchDest && matchStatus
    })

    arr.sort((a, b) => {
      switch (filters.sort) {
        case 'startDate-asc':
          return (new Date(a.startDate).getTime() || 0) - (new Date(b.startDate).getTime() || 0)
        case 'startDate-desc':
          return (new Date(b.startDate).getTime() || 0) - (new Date(a.startDate).getTime() || 0)
        case 'title-asc':
          return (a.title || '').localeCompare(b.title || '')
        case 'title-desc':
          return (b.title || '').localeCompare(a.title || '')
        default:
          return 0
      }
    })

    return arr
  }, [trips, filters])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {session?.user?.name ? `Welcome back, ${session.user.name.split(' ')[0]}!` : 'Your Trips'}
          </h1>
          <p className="text-gray-600 mt-2">Plan your next adventure or continue working on existing trips</p>
        </div>
        <Link href="/plan">
          <Button className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>New Trip</span>
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-600 py-16">Loading trips...</div>
      ) : trips.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">No trips yet</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Create your first trip by selecting a destination and choosing scenic photos that inspire you.
          </p>
          <Link href="/plan">
            <Button>Plan Your First Trip</Button>
          </Link>
        </div>
      ) : (
        <>
          <TripFilters value={filters} onChange={setFilters} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onDelete={handleDelete} onUpdated={handleUpdated} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
