"use client"

import * as React from 'react'
import { DayPicker, DateRange } from 'react-day-picker'

export interface CalendarProps {
  mode?: 'single' | 'range'
  selected?: Date | DateRange
  onSelect?: (date?: Date | DateRange) => void
  initialFocus?: boolean
}

export function Calendar({ mode = 'single', selected, onSelect }: CalendarProps) {
  return (
    <div className="p-3">
      <DayPicker
        mode={mode as any}
        selected={selected as any}
        onSelect={onSelect as any}
        captionLayout="dropdown"
      />
    </div>
  )
}
