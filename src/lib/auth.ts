import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./db"

// In dev, don't crash the app if Google env vars are missing. Only add the provider when both exist.
const googleId = process.env.GOOGLE_CLIENT_ID
const googleSecret = process.env.GOOGLE_CLIENT_SECRET

const providers: NextAuthOptions['providers'] = []
if (googleId && googleSecret) {
  providers.push(
    GoogleProvider({
      clientId: googleId,
      clientSecret: googleSecret,
      authorization: {
        params: {
          prompt: 'select_account',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    })
  )
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  debug: process.env.NEXTAUTH_DEBUG === 'true',
  callbacks: {
    jwt: async ({ user, token }) => {
      if (user) {
        ;(token as any).uid = (user as any).id // persist DB id
      }
      return token
    },
    session: async ({ session, token }) => {
      if (session.user && (token as any).uid) {
        ;(session.user as any).id = (token as any).uid
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
  },
}
