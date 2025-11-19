"use client"

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger

export function DialogContent({ className = '', children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40" />
      <DialogPrimitive.Content
        className={
          'fixed z-50 grid w-full max-w-lg gap-4 border bg-white p-6 shadow-lg duration-200 ' +
          'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md ' +
          className
        }
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function DialogHeader({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={'flex flex-col space-y-1.5 text-center sm:text-left ' + className} {...props} />
}

export function DialogTitle({ className = '', ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={'text-lg font-semibold leading-none tracking-tight ' + className}
      {...props}
    />
  )
}

export function DialogDescription({ className = '', ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description className={'text-sm text-gray-600 ' + className} {...props} />
  )
}
