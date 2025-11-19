"use client"

import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type SortKey = 'startDate-asc' | 'startDate-desc' | 'title-asc' | 'title-desc'

export interface TripFiltersState {
  query: string
  destination: string | 'All'
  status: 'All' | 'planning' | 'photos_selected' | 'itinerary_ready'
  sort: SortKey
}

export interface TripFiltersProps {
  value: TripFiltersState
  onChange: (next: TripFiltersState) => void
}

export default function TripFilters({ value, onChange }: TripFiltersProps) {
  const set = (patch: Partial<TripFiltersState>) => onChange({ ...value, ...patch })

  const destinations = useMemo(() => ['All', 'Dolomites, Italy', 'Switzerland', 'Lofoten'], [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="space-y-1">
        <Label htmlFor="query">Search</Label>
        <Input id="query" placeholder="Search by title or destination" value={value.query} onChange={(e) => set({ query: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="destination">Destination</Label>
        <select
          id="destination"
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={value.destination}
          onChange={(e) => set({ destination: e.target.value as any })}
        >
          {destinations.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={value.status}
          onChange={(e) => set({ status: e.target.value as TripFiltersState['status'] })}
        >
          <option value="All">All</option>
          <option value="planning">Planning</option>
          <option value="photos_selected">Photos selected</option>
          <option value="itinerary_ready">Itinerary ready</option>
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="sort">Sort by</Label>
        <select
          id="sort"
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={value.sort}
          onChange={(e) => set({ sort: e.target.value as SortKey })}
        >
          <option value="startDate-asc">Start date ↑</option>
          <option value="startDate-desc">Start date ↓</option>
          <option value="title-asc">Title A-Z</option>
          <option value="title-desc">Title Z-A</option>
        </select>
      </div>
    </div>
  )
}
