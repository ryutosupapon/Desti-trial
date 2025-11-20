"use client"

import { useState, useRef } from 'react'

export default function UploadTreCimePage() {
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<string>("")
  const inputRef = useRef<HTMLInputElement>(null)

  const pick = () => inputRef.current?.click()

  const onChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    setPreview(URL.createObjectURL(file))
    setStatus('Uploading…')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/destinations/dolomites/tre-cime/upload', { method: 'POST', body: form })
      if (!res.ok) throw new Error('Upload failed')
      setStatus('Uploaded! Refresh your Select Photos page.')
    } catch (e: any) {
      setStatus(e.message || 'Upload failed')
    }
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-4">Upload Tre Cime primary image</h1>
  <p className="text-gray-600 mb-4">This will overwrite the local copy (<code>/public/destinations/dolomites/tre-cime/primary.jpg</code>) but the live site now serves the S3 asset.</p>
      <div className="flex gap-3 mb-4">
        <button className="px-4 py-2 bg-black text-white rounded" onClick={pick}>Choose file</button>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => onChange(e.target.files)} />
      </div>
      {preview && (
        <div className="border rounded overflow-hidden mb-3">
          <img src={preview} alt="Preview" className="w-full h-auto" />
        </div>
      )}
      {status && <div className="text-sm text-gray-700">{status}</div>}
      <div className="mt-6 text-sm text-gray-600">
  After upload, open <a className="text-blue-600 underline" href="https://desti-images.s3.us-east-2.amazonaws.com/destinations/dolomites/tre-cime/primary.jpg" target="_blank" rel="noopener noreferrer">this S3 image</a> to verify, then hard refresh your Select Photos page.
      </div>
    </div>
  )
}
