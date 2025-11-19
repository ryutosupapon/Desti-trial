"use client"

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MapPin,
  Calendar as CalendarIcon,
  Users,
  DollarSign,
  ExternalLink,
  MoreVertical,
  Share2,
  Download,
  Pencil,
  Trash2,
} from 'lucide-react'
import { format, isValid as isValidDate } from 'date-fns'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import EditTripModal from '@/components/EditTripModal'
import DeleteTripModal from '@/components/DeleteTripModal'

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
  itinerary?: any | null
  selectedPhotos?: any[]
}

interface TripCardProps {
  trip: Trip
  onDelete: (id: string) => void
  onUpdated?: (trip: Trip) => void
}

export default function TripCard({ trip, onDelete, onUpdated }: TripCardProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const statusLabel = useMemo(() => {
    const s = (trip.status || '').toLowerCase()
    if (s.includes('itinerary') || s === 'itinerary_ready' || trip.itinerary) return 'itinerary ready'
    if (s.includes('photo') || s === 'photos_selected' || (trip.selectedPhotos && trip.selectedPhotos.length > 0)) return 'photos selected'
    return s || 'planning'
  }, [trip])

  const statusClasses = (status: string) => {
    const key = status.toLowerCase()
    if (key.includes('itinerary')) return 'bg-blue-100 text-blue-800'
    if (key.includes('photo')) return 'bg-amber-100 text-amber-800'
    return 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return '—'
      const d = new Date(dateString)
      if (!isValidDate(d)) return '—'
      return format(d, 'MMM d, yyyy')
    } catch {
      return '—'
    }
  }

  const getDuration = () => {
    try {
      const start = new Date(trip.startDate)
      const end = new Date(trip.endDate)
      if (!isValidDate(start) || !isValidDate(end)) return '—'
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
      return `${days} day${days > 1 ? 's' : ''}`
    } catch {
      return '—'
    }
  }

  const renderPrimaryAction = () => {
    if (trip?.itinerary) {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push(`/plan/itinerary?tripId=${trip.id}`)}
          className="flex-1"
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          View Itinerary
        </Button>
      )
    }
    if (trip?.selectedPhotos && trip.selectedPhotos.length > 0) {
      return (
        <Button size="sm" onClick={() => router.push(`/plan/generate?tripId=${trip.id}`)} className="flex-1">
          Generate Itinerary
        </Button>
      )
    }
    return (
      <Button size="sm" onClick={() => router.push(`/plan/select-photos?tripId=${trip.id}`)} className="flex-1">
        Select Photos
      </Button>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg line-clamp-1">{trip.title}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              {trip.destination}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusClasses(statusLabel)}>{statusLabel}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="More actions">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/plan/itinerary?tripId=${trip.id}`)}>
                  <ExternalLink className="h-4 w-4 mr-2" /> View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
                {/* Download PDF removed */}
                <DropdownMenuItem onClick={() => router.push(`/plan/itinerary?tripId=${trip.id}`)}>
                  <Share2 className="h-4 w-4 mr-2" /> Share
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <div>
              <div>{formatDate(trip.startDate)}</div>
              <div className="text-xs">to {formatDate(trip.endDate)}</div>
            </div>
          </div>

          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            <span>
              {trip.travelers} traveler{trip.travelers > 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center">
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">{getDuration()}</span>
          </div>

          {typeof trip.budget === 'number' && (
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              <span>${trip.budget.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {renderPrimaryAction()}
        </div>
      </CardContent>

      <EditTripModal
        open={editOpen}
        onOpenChange={setEditOpen}
        trip={{
          id: trip.id,
          title: trip.title,
          destination: trip.destination,
          startDate: trip.startDate,
          endDate: trip.endDate,
          travelers: trip.travelers,
          budget: trip.budget ?? undefined,
        }}
        onUpdated={(updated) => {
          // Bubble up to parent to refresh list; allow parent to reconcile
          onUpdated?.(updated)
        }}
      />

      <DeleteTripModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        tripId={trip.id}
        tripTitle={trip.title}
        onDeleted={() => onDelete(trip.id)}
      />
    </Card>
  )
}
