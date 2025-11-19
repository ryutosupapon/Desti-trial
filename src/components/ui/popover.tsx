"use client"

import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'

export const Popover = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger

export function PopoverContent({ className = '', align = 'center', sideOffset = 4, ...props }: PopoverPrimitive.PopoverContentProps & { className?: string }) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={`z-50 w-auto rounded-md border border-gray-200 bg-white p-3 shadow-md outline-none ${className}`}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}
