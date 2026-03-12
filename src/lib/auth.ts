import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

// For demo purposes, we'll use a simple credentials provider
// In production, you'd want to use a more secure authentication method

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "caregiver@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Demo users for hackathon
        const demoUsers = [
          {
            id: "user_001",
            email: "susan@aegis.care",
            password: "demo123",
            name: "Susan Martinez",
            role: "caregiver",
            patientIds: ["patient_001"]
          },
          {
            id: "user_002",
            email: "jennifer@aegis.care",
            password: "demo123",
            name: "Jennifer Thompson-White",
            role: "caregiver",
            patientIds: ["patient_002"]
          },
          {
            id: "user_admin",
            email: "admin@aegis.care",
            password: "admin123",
            name: "Admin User",
            role: "admin",
            patientIds: ["patient_001", "patient_002"]
          }
        ]

        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = demoUsers.find(u => u.email === credentials.email)

        if (!user || user.password !== credentials.password) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          patientIds: user.patientIds
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.patientIds = user.patientIds
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.patientIds = token.patientIds as string[]
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
    error: "/login"
  },
  secret: process.env.NEXTAUTH_SECRET || "aegis-caregiver-demo-secret-key-2024",
  debug: false,
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV !== "production" ? "__Dev-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production"
      }
    }
  }
}

declare module "next-auth" {
  interface User {
    role?: string
    patientIds?: string[]
  }
  
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      role?: string
      patientIds?: string[]
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    patientIds?: string[]
  }
}
