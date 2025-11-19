"use client"

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface LocationFiltersProps {
  selectedFilter: string
  onFilterChange: (filter: string) => void
  locationCounts: Record<string, number>
}

const LOCATION_TYPES = [
  { key: 'all', label: 'All', icon: '🌍' },
  { key: 'mountain', label: 'Mountains', icon: '⛰️' },
  { key: 'lake', label: 'Lakes', icon: '💧' },
  { key: 'hiking', label: 'Hiking', icon: '🥾' },
  { key: 'valley', label: 'Valleys', icon: '🏞️' },
  { key: 'viewpoint', label: 'Views', icon: '📸' },
]

export default function LocationFilters({
  selectedFilter,
  onFilterChange,
  locationCounts,
}: LocationFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
      {LOCATION_TYPES.map((type) => {
        const count = locationCounts[type.key] || 0
        const isSelected = selectedFilter === type.key

        if (count === 0 && type.key !== 'all') return null

        return (
          <Button
            key={type.key}
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange(type.key)}
            className={isSelected ? 'bg-gradient-to-r from-blue-500 to-purple-600' : ''}
          >
            <span className="mr-2">{type.icon}</span>
            {type.label}
            {count > 0 && type.key !== 'all' && (
              <Badge variant="secondary" className="ml-2">
                {count}
              </Badge>
            )}
          </Button>
        )
      })}
    </div>
  )
}
