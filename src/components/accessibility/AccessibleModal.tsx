"use client"
import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface AccessibleModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({ isOpen, onClose, title, children, className = '' }) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      setTimeout(() => { modalRef.current?.focus() }, 100)
      document.body.style.overflow = 'hidden'
      setIsAnimating(true)
      const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
      document.addEventListener('keydown', handleEscape)
      return () => { document.removeEventListener('keydown', handleEscape) }
    } else {
      previousFocusRef.current?.focus()
      document.body.style.overflow = 'unset'
      setIsAnimating(false)
    }
  }, [isOpen])

  const handleClose = () => { setIsAnimating(false); setTimeout(onClose, 150) }

  const trapFocus = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return
    const modal = modalRef.current
    if (!modal) return
    const focusable = modal.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey) { if (document.activeElement === first) { last.focus(); e.preventDefault() } }
    else { if (document.activeElement === last) { first.focus(); e.preventDefault() } }
  }

  if (!isOpen) return null

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 transition-opacity duration-150 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-lg shadow-xl max-w-lg w-full max-h-screen overflow-y-auto transform transition-transform duration-150 ${isAnimating ? 'scale-100' : 'scale-95'} ${className}`}
        tabIndex={-1}
        onKeyDown={trapFocus}
        role="document"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 id="modal-title" className="text-xl font-semibold text-gray-900">{title}</h2>
          <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label="Close modal">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  )
}

export default AccessibleModal
