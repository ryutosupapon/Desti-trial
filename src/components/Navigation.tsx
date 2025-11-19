'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { User, LogOut, MapPin } from 'lucide-react'

export default function Navigation() {
  const { data: session, status } = useSession()

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2" aria-label="Home">
              {/* Logo image; replace /public/logo.png as needed */}
              <Image
                src="/logo.png"
                alt="Desti logo"
                width={64}
                height={64}
                priority
                className="h-16 w-auto"
              />
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="w-8 h-8 animate-pulse bg-gray-200 rounded-full"></div>
            ) : session ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <Link href="/plan">
                  <Button variant="ghost">Plan Trip</Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      {session.user?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={session.user.image} 
                          alt="Profile" 
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <User className="h-6 w-6" />
                      )}
                      <span className="hidden sm:block">{session.user?.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link href="/auth/signin">
                <Button>Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
