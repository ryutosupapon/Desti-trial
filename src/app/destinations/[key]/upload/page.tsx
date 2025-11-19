"use client"

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

type CuratedPhoto = {
  id: string
  url: string
  altText: string
  isPrimary: boolean
}

type CuratedLocation = {
  id: string
  name: string
  description: string
  locationType: string
  photos: CuratedPhoto[]
}

export default function DestinationUploadPage() {
  const params = useParams<{ key: string }>()
  const key = useMemo(() => params?.key ?? '', [params]) as string
  const [locations, setLocations] = useState<CuratedLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<Record<string, string>>({})
  const [bust, setBust] = useState(0)

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch(`/api/destinations/${key}/locations`)
        if (res.ok) {
          const data = await res.json().catch(() => ({ locations: [] }))
          setLocations(Array.isArray(data.locations) ? data.locations : [])
        } else {
          setLocations([])
        }
      } catch (e) {
        setLocations([])
      } finally {
        setLoading(false)
      }
    }
    if (key) fetchLocations()
  }, [key])

  const handleUpload = async (photo: CuratedPhoto, file: File) => {
    try {
      setStatus((s) => ({ ...s, [photo.id]: 'Uploading…' }))
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`/api/curated/photos/${photo.id}/upload`, {
        method: 'POST',
        body: form,
      })
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
      setStatus((s) => ({ ...s, [photo.id]: 'Uploaded ✅' }))
      setBust(Date.now())
    } catch (e: any) {
      setStatus((s) => ({ ...s, [photo.id]: `Error: ${e?.message || 'Upload failed'}` }))
    }
  }

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-8">Loading uploads…</div>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">Replace curated photos</h1>
      <p className="text-gray-600 mb-6">Destination key: <span className="font-mono">{key}</span>. Pick a photo and upload a replacement. It will immediately reflect in the Select Photos grid.</p>

      {locations.length === 0 && (
        <Card>
          <CardContent className="pt-6">No curated locations found for this key.</CardContent>
        </Card>
      )}

      <div className="space-y-8">
        {locations.map((loc) => (
          <div key={loc.id}>
            <h2 className="text-xl font-medium mb-3">{loc.name}</h2>
            {loc.description && <p className="text-gray-600 mb-3 text-sm">{loc.description}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {loc.photos.map((photo) => {
                const normalizedSrc = (photo.url || '').startsWith('/') ? photo.url : `/${photo.url || ''}`
                const preview = `${normalizedSrc}?t=${bust}`
                return (
                  <Card key={photo.id} className="overflow-hidden">
                    <div className="relative aspect-[4/3] bg-gray-100">
                      <Image src={preview} alt={photo.altText} fill className="object-cover" unoptimized />
                    </div>
                    <CardContent className="p-3">
                      <div className="text-sm font-medium mb-1">{photo.altText || 'Curated Photo'}</div>
                      <div className="text-xs text-gray-600 mb-3">{photo.isPrimary ? 'Primary' : 'Secondary'}</div>

                      <label className="block">
                        <span className="text-sm text-gray-700">Replace image file</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="mt-1 block w-full text-sm"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) handleUpload(photo, f)
                          }}
                        />
                      </label>

                      <div className="text-xs text-gray-500 mt-2 min-h-[1.25rem]">{status[photo.id] || ''}</div>

                      <div className="flex items-center gap-2 mt-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => setBust(Date.now())}>Refresh preview</Button>
                        <code className="text-xs text-gray-500 truncate">{normalizedSrc}</code>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
