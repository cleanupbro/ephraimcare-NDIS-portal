import type { Metadata } from 'next'
import '@ephraimcare/ui/styles/globals.css'

export const metadata: Metadata = {
  title: 'Ephraim Care - Participant Portal',
  description: 'View your shifts, case notes, and invoices',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-body antialiased">{children}</body>
    </html>
  )
}
