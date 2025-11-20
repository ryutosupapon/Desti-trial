import { NextResponse } from 'next/server'

// Temporary diagnostics route to verify Amplify environment variable injection.
// SECURITY: Returns only presence flags (never actual secret values). Remove after verification.
export async function GET() {
  const keys = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
  ] as const

  const result: Record<string, string> = {}
  keys.forEach((k) => {
    result[k] = process.env[k] ? 'present' : 'missing'
  })

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'no-store', // avoid caching so you see real-time presence
    },
  })
}
