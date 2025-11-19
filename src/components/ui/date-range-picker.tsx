"use client"

import * as React from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { format, differenceInCalendarDays } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

export interface DateRangePickerProps {
  value: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
  placeholder?: string
  disabled?: boolean
  autoClose?: boolean
}

// Helper to display a concise label for a picked range
function formatRange(range: DateRange | undefined) {
  if (!range?.from) return ''
  if (!range.to) return format(range.from, 'PPP')
  const nights = Math.max(0, differenceInCalendarDays(range.to, range.from))
  return `${format(range.from, 'MMM d')} → ${format(range.to, 'MMM d, yyyy')} (${nights} night${nights === 1 ? '' : 's'})`
}

export function DateRangePicker({ value, onChange, placeholder = 'Select date range', disabled, autoClose = true }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (range: DateRange | undefined) => {
    onChange(range)
    // Close when both ends selected
    if (autoClose && range?.from && range?.to) {
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn('w-full justify-start text-left font-normal', !value?.from && 'text-gray-500')}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value?.from ? formatRange(value) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={value as any}
          onSelect={handleSelect as any}
          initialFocus
        />
        {value?.from && !value.to && (
          <div className="px-3 pb-3 text-xs text-gray-500">Select an end date</div>
        )}
      </PopoverContent>
    </Popover>
  )
}
