"use client"

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ManageDestinationPage() {
  const params = useParams<{ key: string }>()
  const key = useMemo(() => params?.key ?? '', [params]) as string
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [locationType, setLocationType] = useState('viewpoint')
  const [difficulty, setDifficulty] = useState('easy')
  const [bestTime, setBestTime] = useState('')
  const [coordinates, setCoordinates] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<string>('')

  const submit = async () => {
    try {
      setStatus('Uploading…')
      const form = new FormData()
      form.append('name', name)
      form.append('description', description)
      form.append('locationType', locationType)
      form.append('difficulty', difficulty)
      form.append('bestTime', bestTime)
      form.append('coordinates', coordinates)
      if (file) form.append('file', file)

      const res = await fetch(`/api/destinations/${key}/locations`, { method: 'POST', body: form })
      if (!res.ok) throw new Error(`Create failed: ${res.status}`)
      setStatus('Created ✅')
      setName(''); setDescription(''); setBestTime(''); setCoordinates(''); setFile(null)
    } catch (e: any) {
      setStatus(`Error: ${e?.message || 'Failed'}`)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">Add curated location</h1>
      <p className="text-gray-600 mb-6">Destination: <span className="font-mono">{key}</span></p>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input className="mt-1 w-full border rounded p-2" value={name} onChange={e => setName(e.target.value)} placeholder="Cinque Torri" />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea className="mt-1 w-full border rounded p-2" value={description} onChange={e => setDescription(e.target.value)} placeholder="Iconic rock towers…" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">Type</label>
              <select className="mt-1 w-full border rounded p-2" value={locationType} onChange={e => setLocationType(e.target.value)}>
                <option value="viewpoint">viewpoint</option>
                <option value="mountain">mountain</option>
                <option value="lake">lake</option>
                <option value="meadow">meadow</option>
                <option value="beach">beach</option>
                <option value="valley">valley</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Difficulty</label>
              <select className="mt-1 w-full border rounded p-2" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                <option value="easy">easy</option>
                <option value="moderate">moderate</option>
                <option value="hard">hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Best time</label>
              <input className="mt-1 w-full border rounded p-2" value={bestTime} onChange={e => setBestTime(e.target.value)} placeholder="Jun-Oct" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Coordinates</label>
            <input className="mt-1 w-full border rounded p-2" value={coordinates} onChange={e => setCoordinates(e.target.value)} placeholder="46.4906,12.0383" />
          </div>
          <div>
            <label className="block text-sm font-medium">Primary image</label>
            <input className="mt-1" type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={submit}>Create</Button>
            <span className="text-sm text-gray-500">{status}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
