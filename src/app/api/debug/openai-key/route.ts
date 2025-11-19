import { NextResponse } from 'next/server'

export function GET() {
  const raw = process.env.OPENAI_API_KEY
  const status = !raw
    ? 'missing'
    : /YOUR_OPENAI_KEY_HERE/i.test(raw)
      ? 'placeholder'
      : 'present'
  // Return only a truncated sample of the key for safety
  return NextResponse.json({ status, sample: raw ? raw.slice(0, 8) + '...' : null })
}

// NOTE: Remove this debug route after verifying environment configuration.