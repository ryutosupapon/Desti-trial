import * as React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'secondary' | 'outline'

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-900 text-white',
  secondary: 'bg-gray-100 text-gray-800',
  outline: 'border border-gray-300 text-gray-700',
}

export function Badge({ className = '', children, variant = 'default' }: { className?: string; children: React.ReactNode; variant?: BadgeVariant }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variantClasses[variant], className)}>
      {children}
    </span>
  )
}
