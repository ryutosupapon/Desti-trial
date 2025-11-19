"use client"

import * as React from 'react'

export function Command({ children }: { children: React.ReactNode }) {
  return <div className="w-full text-sm">{children}</div>
}

export function CommandInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border-b border-gray-200 px-3 py-2 outline-none ${props.className ?? ''}`}
    />
  )
}

export function CommandEmpty({ children }: { children: React.ReactNode }) {
  return <div className="px-3 py-2 text-gray-500">{children}</div>
}

export function CommandGroup({ children }: { children: React.ReactNode }) {
  return <div className="py-1">{children}</div>
}

export function CommandItem({ onSelect, className = '', children }: { onSelect?: (value?: string) => void; className?: string; children: React.ReactNode }) {
  return (
    <div
      role="option"
      onClick={() => onSelect?.()}
      className={`px-3 py-2 hover:bg-gray-100 ${className}`}
    >
      {children}
    </div>
  )
}
