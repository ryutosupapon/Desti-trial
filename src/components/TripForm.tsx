"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DateRangePicker } from '@/components/ui/date-range-picker'
// Destination is selected from a fixed dropdown per requirements
import { Users, DollarSign, MapPin } from 'lucide-react'

const tripSchema = z.object({
  title: z.string().min(1, 'Trip title is required'),
  destination: z.string().min(1, 'Destination is required'),
  startDate: z.date(),
  endDate: z.date(),
  travelers: z.number().min(1, 'At least 1 traveler required').max(20, 'Maximum 20 travelers'),
  budget: z.number().optional(),
}).refine((data) => data.endDate >= data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
})

type TripFormData = z.infer<typeof tripSchema>

interface TripFormProps {
  initialData?: Partial<TripFormData>
  onSubmit?: (data: TripFormData) => void
  isEditing?: boolean
}

export default function TripForm({ initialData, onSubmit, isEditing = false }: TripFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [destination, setDestination] = useState(initialData?.destination || '')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      title: initialData?.title || '',
  destination: initialData?.destination || '',
      travelers: initialData?.travelers || 1,
      budget: initialData?.budget,
      ...initialData,
    },
  })

  const startDate = watch('startDate')
  const endDate = watch('endDate')

  const handleFormSubmit = async (data: TripFormData) => {
    if (onSubmit) {
      onSubmit(data)
      return
    }

    setIsLoading(true)
    try {
      // Normalize optional numeric fields to avoid sending NaN which becomes null in JSON

      // Coerce numbers to integers for server (Prisma Int)
      const travelersInt = Math.trunc(data.travelers)
      const normalizedBudget = Number.isFinite((data as any).budget) ? Math.trunc(data.budget as number) : undefined

      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          startDate: data.startDate.toISOString(),
          endDate: data.endDate.toISOString(),
          travelers: travelersInt,
          budget: normalizedBudget,
        }),
      })

      const result = await response.json().catch(() => null)
      if (!response.ok) {
        let msg = (result && (result.error || result.message)) || 'Failed to create trip'
        if (result?.details) {
          if (Array.isArray(result.details)) {
            const first = result.details[0]
            const issue = first?.message || JSON.stringify(first)
            msg += `: ${issue}`
          } else if (typeof result.details === 'string') {
            msg += `: ${result.details}`
          }
        }
        throw new Error(msg)
      }

      const trip = result
      router.push(`/plan/select-photos?tripId=${trip.id}`)
    } catch (error) {
      console.error('Error creating trip:', error)
      const message = error instanceof Error ? error.message : 'Failed to create trip. Please try again.'
      alert(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-6 w-6" />
          <span>{isEditing ? 'Edit Trip' : 'Plan Your Trip'}</span>
        </CardTitle>
        <CardDescription>
          {isEditing 
            ? 'Update your trip details'
            : 'Tell us about your dream destination and travel preferences'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Trip Title</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="My Amazing Trip to..."
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <select
              id="destination"
              {...register('destination')}
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value)
                setValue('destination', e.target.value)
              }}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>
                Select a destination
              </option>
              <option value="Dolomites, Italy">Dolomites, Italy</option>
              <option value="Switzerland">Switzerland</option>
              <option value="Lofoten">Lofoten</option>
            </select>
            {errors.destination && (
              <p className="text-sm text-red-500">{errors.destination.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Date range</Label>
            <DateRangePicker
              value={{ from: startDate, to: endDate }}
              onChange={(range) => {
                // Update both fields; let zod validation surface any issues
                // If only from is selected, clear endDate to avoid stale value
                if (!range?.from) {
                  setValue('startDate', undefined as unknown as Date, { shouldValidate: true })
                  setValue('endDate', undefined as unknown as Date, { shouldValidate: true })
                } else {
                  setValue('startDate', range.from, { shouldValidate: true })
                  setValue('endDate', range?.to as any, { shouldValidate: true })
                }
              }}
              placeholder="Select your travel dates"
            />
            {(errors.startDate || errors.endDate) && (
              <p className="text-sm text-red-500">{errors.endDate?.message || errors.startDate?.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="travelers">Number of Travelers</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  id="travelers"
                  type="number"
                  min="1"
                  max="20"
                  {...register('travelers', { valueAsNumber: true })}
                  className="pl-9"
                />
              </div>
              {errors.travelers && (
                <p className="text-sm text-red-500">{errors.travelers.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget (optional)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  id="budget"
                  type="number"
                  min="0"
                  {...register('budget', { valueAsNumber: true })}
                  placeholder="Total budget"
                  className="pl-9"
                />
              </div>
              {errors.budget && (
                <p className="text-sm text-red-500">{errors.budget.message}</p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading 
              ? 'Creating...' 
              : isEditing 
                ? 'Update Trip' 
                : 'Continue to Photo Selection'
            }
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
