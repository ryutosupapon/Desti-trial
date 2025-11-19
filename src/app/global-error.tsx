'use client'

// Global error boundary for the root (captures layout errors). This file must include <html> and <body>.

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.error('Global Error Boundary:', error)
  }

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="max-w-xl w-full bg-white border rounded-lg shadow-sm p-6 space-y-4">
            <h1 className="text-xl font-semibold">App crashed</h1>
            <p className="text-gray-700">
              An unexpected error occurred. You can try again or return home.
            </p>
            {error?.message && (
              <details className="text-sm text-gray-600 bg-gray-50 border rounded p-3 whitespace-pre-wrap" open>
                <summary className="cursor-pointer font-medium">Error details</summary>
                {error.message}
                {error?.digest ? `\nDigest: ${error.digest}` : ''}
              </details>
            )}
            <div className="flex items-center gap-3">
              <button
                className="inline-flex items-center px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => reset()}
              >
                Try again
              </button>
              <a className="inline-flex items-center px-4 py-2 rounded border hover:bg-gray-50" href="/">Go home</a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
