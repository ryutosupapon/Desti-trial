import NextAuth, { DefaultSession } from 'next-auth'

// Extend the default Session to include user.id
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
    } & DefaultSession['user']
  }
}
