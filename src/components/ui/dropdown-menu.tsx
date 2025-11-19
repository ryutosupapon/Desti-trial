'use client'

import * as React from 'react'

interface DropdownMenuContextValue {
  open: boolean
  setOpen: (o: boolean) => void
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null)

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

export function DropdownMenuTrigger({ asChild = false, children }: { asChild?: boolean; children: React.ReactNode }) {
  const ctx = React.useContext(DropdownMenuContext)
  if (!ctx) return null

  if (asChild) {
    // Pass the onClick toggler down to the single child element
    const child = React.Children.only(children) as React.ReactElement<any>
    const prevOnClick = child.props?.onClick as ((e: any) => void) | undefined
    const handleClick = (e: any) => {
      prevOnClick?.(e)
      if (!e?.defaultPrevented) ctx.setOpen(!ctx.open)
    }
    return React.cloneElement(child, { onClick: handleClick })
  }

  return (
    <button type="button" onClick={() => ctx.setOpen(!ctx.open)} className="outline-none">
      {children}
    </button>
  )
}

export function DropdownMenuContent({ children, align = 'start', className = '' }: { children: React.ReactNode; align?: 'start' | 'end'; className?: string }) {
  const ctx = React.useContext(DropdownMenuContext)
  if (!ctx || !ctx.open) return null
  const alignment = align === 'end' ? 'right-0' : 'left-0'
  return (
    <div className={`absolute ${alignment} z-50 mt-2 w-48 origin-top-right rounded-md border border-gray-200 bg-white shadow-lg ${className}`}>
      <div className="py-1">{children}</div>
    </div>
  )
}

export function DropdownMenuItem({ onClick, children, className = '' }: { onClick?: () => void; children: React.ReactNode; className?: string }) {
  const ctx = React.useContext(DropdownMenuContext)
  return (
    <button
      type="button"
      onClick={() => {
        onClick?.()
        ctx?.setOpen(false)
      }}
      className={`flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${className}`}
    >
      {children}
    </button>
  )
}
