'use client'

import * as React from 'react'

export function Card({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`rounded-lg border border-gray-200 bg-white ${className}`} />
}

export function CardHeader({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`p-6 ${className}`} />
}

export function CardTitle({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 {...props} className={`text-xl font-semibold leading-none tracking-tight ${className}`} />
}

export function CardDescription({ className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={`text-sm text-gray-600 ${className}`} />
}

export function CardContent({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`p-6 pt-0 ${className}`} />
}
