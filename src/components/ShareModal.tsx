"use client"

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, CheckCircle } from 'lucide-react'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
  tripTitle: string
}

export default function ShareModal({ isOpen, onClose, tripId, tripTitle }: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/shared/${tripId}` : ''
  const shareText = `Check out my ${tripTitle} travel itinerary on Desti!`

  const handleCopy = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpen = (url: string) => {
    if (typeof window === 'undefined') return
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleFacebook = () => {
    handleOpen(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`)
  }

  const handleTwitter = () => {
    handleOpen(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    )
  }

  const handleEmail = () => {
    if (typeof window === 'undefined') return
    window.location.href = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareUrl)}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Itinerary</DialogTitle>
          <DialogDescription>Anyone with the link can view your travel plan</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Copy Link */}
          <div className="flex items-center space-x-2">
            <Input value={shareUrl} readOnly className="flex-1" />
            <Button size="sm" onClick={handleCopy} className="flex-shrink-0">
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>

          {/* Social Share */}
          <div className="grid grid-cols-3 gap-3">
            <Button variant="outline" onClick={handleFacebook} className="w-full">
              {/* Using text instead of icons to avoid extra deps */}
              Facebook
            </Button>
            <Button variant="outline" onClick={handleTwitter} className="w-full">
              Twitter
            </Button>
            <Button variant="outline" onClick={handleEmail} className="w-full">
              Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
