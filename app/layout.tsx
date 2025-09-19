import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'MoodSphere - Track Your Emotional Health',
  description: 'Track, visualize, and understand your emotional health with MoodSphere',
  authors: [{ name: 'MoodSphere' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.svg',
    apple: '/icon-192.svg',
  },
  openGraph: {
    title: 'MoodSphere - Track Your Emotional Health',
    description: 'Track, visualize, and understand your emotional health with MoodSphere',
    type: 'website',
    images: ['/icon-512.svg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MoodSphere - Track Your Emotional Health',
    description: 'Track, visualize, and understand your emotional health with MoodSphere',
    images: ['/icon-512.svg'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#8B5CF6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MoodSphere" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}