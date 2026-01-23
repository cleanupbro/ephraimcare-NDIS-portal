import type { Metadata } from 'next'
import '@ephraimcare/ui/styles/globals.css'

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
      <body className="font-body antialiased">{children}</body>
    </html>
  )
}
