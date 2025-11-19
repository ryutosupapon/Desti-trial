'use client'

// Route-segment error boundary for App Router routes
// Note: Do NOT include <html> or <body> here; this renders inside the nearest layout.

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.error('App Error Boundary:', error)
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-xl w-full bg-white border rounded-lg shadow-sm p-6 space-y-4">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-gray-700">
          An unexpected error occurred while rendering this page. You can try again or go back to the home page.
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
          <a
            className="inline-flex items-center px-4 py-2 rounded border hover:bg-gray-50"
            href="/"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  )
}
