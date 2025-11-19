import { NextResponse } from 'next/server'

export async function GET() {
  const required = [
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ] as const

  const data = Object.fromEntries(
    required.map(k => [k, process.env[k] ? 'present' : 'missing'])
  ) as Record<typeof required[number], string>

  return NextResponse.json({
    env: data,
    note: 'Values are redacted. Ensure all show "present". Restart dev server after changes.'
  })
}
