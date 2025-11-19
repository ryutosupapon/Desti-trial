"use client"

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import Image from 'next/image'

interface Photo {
  id: string
  url: string
  altText: string
  isPrimary: boolean
}

interface Location {
  id: string
  name: string
  description: string
  locationType: string
  difficulty?: string
  bestTime?: string
  photos: Photo[]
}

interface PhotoCardProps {
  location: Location
  photo: Photo
  isSelected: boolean
  onToggle: (photoId: string) => void
}

export default function PhotoCard({ location, photo, isSelected, onToggle }: PhotoCardProps) {
  const [imageError, setImageError] = useState(false)
  // Normalize URLs coming from DB (ensure leading slash for public assets)
  const srcUrl = (photo?.url || '').startsWith('/') ? photo.url : `/${photo?.url || ''}`


  if (imageError) {
    // Fallback to a plain <img> if Next/Image optimization fails
    return (
      <Card
        className={`relative overflow-hidden cursor-pointer bg-gray-100 ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
        onClick={() => onToggle(photo.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onToggle(photo.id)
        }}
        aria-pressed={isSelected}
      >
        <div className="relative aspect-square">
          <img src={srcUrl} alt={photo.altText} className="absolute inset-0 w-full h-full object-cover" />
        </div>

        {/* Only show the location name */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pointer-events-none">
          <h3 className="text-white font-semibold text-sm line-clamp-1">{location.name}</h3>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className={`relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
      }`}
    >
      <div
  className="relative aspect-square bg-gray-100"
        onClick={() => onToggle(photo.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onToggle(photo.id)
        }}
        aria-pressed={isSelected}
      >
        <Image
          src={srcUrl}
          alt={photo.altText}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 33vw"
          onError={() => setImageError(true)}
          unoptimized
        />

        {/* Only show the location name */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pointer-events-none">
          <h3 className="text-white font-semibold text-sm line-clamp-1">{location.name}</h3>
        </div>
      </div>
    </Card>
  )
}
