import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import 'react-day-picker/dist/style.css'
import ClientShell from '@/components/providers/ClientShell'

const inter = Inter({ subsets: ['latin'] })

// Asset version for cache-busting (bump NEXT_PUBLIC_ASSET_VERSION when replacing icons)
const assetVersion = process.env.NEXT_PUBLIC_ASSET_VERSION || '1'

export const metadata: Metadata = {
  title: 'Desti - Visual Travel Planning',
  description: 'Plan your perfect trip with visual inspiration',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
    shortcut: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Theme color (icons are now handled by Next metadata above) */}
        <meta name="theme-color" content="#0a5ec2" />
      </head>
      <body className={inter.className}>
        <ClientShell>
          {children}
        </ClientShell>
      </body>
    </html>
  )
}
