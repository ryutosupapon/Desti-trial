"use client"

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { MapPin } from 'lucide-react'
import { PlacePrediction } from '@/lib/google-places'

interface DestinationSearchProps {
  value: string
  onSelect: (destination: string) => void
  placeholder?: string
}

export default function DestinationSearch({ 
  value, 
  onSelect, 
  placeholder = "Search destinations..." 
}: DestinationSearchProps) {
  const [query, setQuery] = useState(value)
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (query.length >= 3) {
      timeoutRef.current = setTimeout(async () => {
        setIsLoading(true)
        try {
          const response = await fetch(
            `/api/destinations/search?q=${encodeURIComponent(query)}`
          )
          const data = await response.json()
          setPredictions(data.predictions || [])
        } catch (error) {
          console.error('Search error:', error)
          setPredictions([])
        } finally {
          setIsLoading(false)
        }
      }, 300)
    } else {
      setPredictions([])
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [query])

  const handleSelect = (destination: string) => {
    setQuery(destination)
    onSelect(destination)
    setIsOpen(false)
    setPredictions([])
  }

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
      
      {isOpen && (query.length >= 3 || predictions.length > 0) && (
        <div className="absolute top-full z-50 w-full rounded-md border bg-white p-0 text-gray-900 shadow-md outline-none">
          <Command>
            <CommandEmpty>
              {isLoading ? "Searching..." : "No destinations found."}
            </CommandEmpty>
            {predictions.length > 0 && (
              <CommandGroup>
                {predictions.map((prediction) => (
                  <CommandItem
                    key={prediction.place_id}
                    onSelect={() => handleSelect(prediction.description)}
                    className="cursor-pointer"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {prediction.structured_formatting.main_text}
                      </span>
                      <span className="text-sm text-gray-500">
                        {prediction.structured_formatting.secondary_text}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </Command>
        </div>
      )}
    </div>
  )
}
