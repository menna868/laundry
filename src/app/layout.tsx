
import './globals.css'
import { ReactNode } from 'react'
import { AuthProvider } from '@/app/context/AuthContext'
import { GoogleOAuthProvider } from '@react-oauth/google'

export const metadata = {
  title: 'Laundry Service App',
  description: 'Fast and convenient laundry service',
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <GoogleOAuthProvider clientId={CLIENT_ID}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  )
}
