import type { Metadata } from 'next'
import '@ephraimcare/ui/styles/globals.css'
import { QueryProvider } from '@/providers/query-provider'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'Ephraim Care - Admin Portal',
  description: 'NDIS participant management portal for Ephraim Care',
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
        <Toaster />
      </body>
    </html>
  )
}
