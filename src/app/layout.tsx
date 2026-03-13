
import './globals.css'
import { ReactNode } from 'react'
import { AuthProvider } from '@/app/context/AuthContext'

export const metadata = {
  title: 'Laundry Service App',
  description: 'Fast and convenient laundry service',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
