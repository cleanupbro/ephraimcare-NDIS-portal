import type { Metadata } from 'next'
import '@ephraimcare/ui/styles/globals.css'
import { QueryProvider } from '@/providers/query-provider'

export const metadata: Metadata = {
  title: 'Ephraim Care - Participant Portal',
  description: 'View your shifts, case notes, and invoices',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-body antialiased">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}
