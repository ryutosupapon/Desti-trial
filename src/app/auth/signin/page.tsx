'use client'

import { signIn, getSession, getProviders, ClientSafeProvider } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

function SignInInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams?.get('error') ?? null
  const hasError = Boolean(error)
  const [providers, setProviders] = useState<Record<string, ClientSafeProvider> | null>(null)
  const googleAvailable = Boolean(providers?.google)

  const errorHelp = (() => {
    if (!error) return null
    switch (error) {
      case 'google':
        return 'Provider failed to initialize. This usually means env vars were not loaded or the OAuth app is misconfigured.'
      case 'OAuthSignin':
        return 'Failed to construct the authorization URL. Check NEXTAUTH_URL and AUTH_TRUST_HOST.'
      case 'Configuration':
        return 'Invalid provider configuration. Double-check GOOGLE_CLIENT_ID/SECRET.'
      case 'Callback':
        return 'Callback URL mismatch. Ensure the redirect URI matches your Google console settings.'
      case 'AccessDenied':
        return 'Access denied by the provider. Try another account or verify scopes.'
      default:
        return 'Sign-in error. See details below and try again.'
    }
  })()

  // Prefetch session (defensive: don't crash on errors)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const session = await getSession()
        if (mounted && session) router.push('/dashboard')
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('getSession failed on /auth/signin (ignored):', e)
      }
    })()
    return () => { mounted = false }
  }, [router])

  // Load available auth providers so we can disable the button if Google is not configured
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
  const p = (await getProviders()) as Record<string, ClientSafeProvider> | null
  if (mounted) setProviders(p ?? {})
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('getProviders failed (likely misconfiguration). Sign-in button will be disabled.', e)
        if (mounted) setProviders({} as any)
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to Desti</CardTitle>
          <CardDescription>
            Sign in to start planning your perfect trip
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasError && (
            <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3 space-y-1">
              <div className="font-medium">Google sign-in failed</div>
              <div className="text-red-700">Error: <code className="px-1 py-0.5 bg-red-100 rounded">{error}</code></div>
              {errorHelp && <div className="text-red-700">{errorHelp}</div>}
              <ul className="text-xs text-red-700 list-disc pl-5 space-y-0.5">
                <li>Restart the dev server after editing .env.</li>
                <li>Ensure NEXTAUTH_URL is http://localhost:3001 and AUTH_TRUST_HOST=true (dev only).</li>
                <li>In Google Cloud Console, add Authorized JavaScript origin: http://localhost:3001</li>
                <li>And Authorized redirect URI: http://localhost:3001/api/auth/callback/google</li>
              </ul>
              <div className="text-xs">
                Dev tip: open <a className="underline" href="/api/debug/auth-env" target="_blank" rel="noreferrer">/api/debug/auth-env</a> to verify required env vars are loaded.
              </div>
            </div>
          )}
          {!googleAvailable && (
            <div className="mb-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
              Google provider is not configured. The button is disabled. Check <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code>.
            </div>
          )}
          <Button
            className="w-full"
            disabled={!googleAvailable}
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          >
            Continue with Google
          </Button>
          
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignInInner />
    </Suspense>
  )
}
