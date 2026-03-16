"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase/client'

/**
 * BRIDGE: Mimics the next-auth useSession structure
 * to allow Aegis components to work with version2's Firebase auth
 * without extensive rewriting.
 */

interface Session {
  user: {
    name: string | null
    email: string | null
    image: string | null
    uid: string
  } | null
}

type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading'

interface AuthContextType {
  data: Session | null
  status: AuthStatus
}

const AuthContext = createContext<AuthContextType>({
  data: null,
  status: 'loading'
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    const auth = getFirebaseAuth()
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        setSession({
          user: {
            name: user.displayName,
            email: user.email,
            image: user.photoURL,
            uid: user.uid
          }
        })
        setStatus('authenticated')
      } else {
        setSession(null)
        setStatus('unauthenticated')
      }
    })

    return () => unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ data: session, status }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * SHADOW HOOK: Mimics next-auth's useSession
 */
export function useSession() {
  return useContext(AuthContext)
}

// Aliases for components that might import these names
export const SessionProvider = AuthProvider
