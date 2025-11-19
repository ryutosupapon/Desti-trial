import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const providers = authOptions.providers?.map(p => (p as any).id || (p as any).name) || []
    const hasAdapter = !!authOptions.adapter
    return NextResponse.json({ providers, hasAdapter })
  } catch (e:any) {
    return NextResponse.json({ error: e.message || 'unknown' }, { status: 500 })
  }
}
