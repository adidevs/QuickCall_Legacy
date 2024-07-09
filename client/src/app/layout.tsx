import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'QuickCall',
  description: 'Connecting People Quickly',
  keywords: ['QuickCall', 'Video Call', 'Call', 'Video', 'Chat'],
}

export default function RootLayout({children}: { children: React.ReactNode}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href="./favicon.ico"
        />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
