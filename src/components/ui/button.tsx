'use client'

import * as React from 'react'

type Variant = 'default' | 'ghost' | 'outline' | 'secondary'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variantClasses: Record<Variant, string> = {
  default: 'bg-blue-600 text-white hover:bg-blue-700',
  ghost: 'bg-transparent hover:bg-gray-100',
  outline: 'border border-gray-300 hover:bg-gray-50',
  secondary: 'bg-gray-800 text-white hover:bg-black',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-5 py-2.5 text-lg',
}

export function Button({ className = '', variant = 'default', size = 'md', ...props }: ButtonProps) {
  const classes = `inline-flex items-center justify-center rounded-md transition-colors ${variantClasses[variant]} ${sizeClasses[size]} ${className}`
  return <button {...props} className={classes} />
}

export default Button
