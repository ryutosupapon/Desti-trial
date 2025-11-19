"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

export interface DeleteTripModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tripId: string
  tripTitle?: string
  onDeleted?: () => void
}

export default function DeleteTripModal({ open, onOpenChange, tripId, tripTitle, onDeleted }: DeleteTripModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        const msg = (json && (json.error || json.message)) || 'Failed to delete trip'
        throw new Error(msg)
      }
      onDeleted?.()
      onOpenChange(false)
    } catch (e) {
      console.error('Delete trip failed', e)
      const message = e instanceof Error ? e.message : 'Failed to delete trip. Please try again.'
      alert(message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            <span>Delete Trip</span>
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete
            {tripTitle ? ` "${tripTitle}"` : ' this trip'} and remove its data from our servers.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={isDeleting}>
            {isDeleting ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
