"use client"

import { useState, useMemo } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Users, DollarSign, MapPin } from 'lucide-react'

const editSchema = z.object({
  title: z.string().min(1, 'Trip title is required'),
  destination: z.string().min(1, 'Destination is required'),
  startDate: z.date(),
  endDate: z.date(),
  travelers: z.number().min(1, 'At least 1 traveler required').max(20, 'Maximum 20 travelers'),
  budget: z.number().optional(),
}).refine((data) => data.endDate >= data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
})

export type EditTripFormData = z.infer<typeof editSchema>

export interface EditTripModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trip: {
    id: string
    title: string
    destination: string
    startDate: string | Date
    endDate: string | Date
    travelers: number
    budget?: number | null
  }
  onUpdated?: (updated: any) => void
}

export default function EditTripModal({ open, onOpenChange, trip, onUpdated }: EditTripModalProps) {
  const [isSaving, setIsSaving] = useState(false)

  const initialStart = useMemo(() => (trip.startDate instanceof Date ? trip.startDate : new Date(trip.startDate)), [trip.startDate])
  const initialEnd = useMemo(() => (trip.endDate instanceof Date ? trip.endDate : new Date(trip.endDate)), [trip.endDate])

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<EditTripFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: trip.title,
      destination: trip.destination,
      startDate: initialStart,
      endDate: initialEnd,
      travelers: trip.travelers,
      budget: trip.budget ?? undefined,
    },
  })

  const startDate = watch('startDate')
  const endDate = watch('endDate')

  const onSubmit = async (data: EditTripFormData) => {
    setIsSaving(true)
    try {
      const travelersInt = Math.trunc(data.travelers)
      const normalizedBudget = Number.isFinite((data as any).budget) ? Math.trunc(data.budget as number) : undefined

      const res = await fetch(`/api/trips/${trip.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          destination: data.destination,
          startDate: data.startDate.toISOString(),
          endDate: data.endDate.toISOString(),
          travelers: travelersInt,
          budget: normalizedBudget,
        }),
      })

      const json = await res.json().catch(() => null)
      if (!res.ok) {
        const msg = (json && (json.error || json.message)) || 'Failed to update trip'
        throw new Error(msg)
      }

      onUpdated?.(json)
      onOpenChange(false)
    } catch (e) {
      console.error('Edit trip failed', e)
      const message = e instanceof Error ? e.message : 'Failed to update trip. Please try again.'
      alert(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Edit Trip</span>
          </DialogTitle>
          <DialogDescription>Update your trip details below.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Trip Title</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <select
              id="destination"
              {...register('destination')}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Dolomites, Italy">Dolomites, Italy</option>
              <option value="Switzerland">Switzerland</option>
              <option value="Lofoten">Lofoten</option>
            </select>
            {errors.destination && <p className="text-sm text-red-500">{errors.destination.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Date range</Label>
            <DateRangePicker
              value={{ from: startDate, to: endDate }}
              onChange={(range) => {
                if (!range?.from) {
                  setValue('startDate', undefined as unknown as Date, { shouldValidate: true })
                  setValue('endDate', undefined as unknown as Date, { shouldValidate: true })
                } else {
                  setValue('startDate', range.from, { shouldValidate: true })
                  setValue('endDate', range?.to as any, { shouldValidate: true })
                }
              }}
              placeholder="Update trip dates"
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
                <Input id="travelers" type="number" min={1} max={20} {...register('travelers', { valueAsNumber: true })} className="pl-9" />
              </div>
              {errors.travelers && <p className="text-sm text-red-500">{errors.travelers.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (optional)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input id="budget" type="number" min={0} {...register('budget', { valueAsNumber: true })} className="pl-9" />
              </div>
              {errors.budget && <p className="text-sm text-red-500">{errors.budget.message}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save changes'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
