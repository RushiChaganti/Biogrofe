import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { ThemeProvider } from "next-themes"

export const metadata: Metadata = {
  title: "Biogrofe - Biotechnology Directory",
  description: "Discover leading biotechnology companies, research institutions, and industry partners worldwide",
  keywords: ["biotechnology", "biotech", "companies", "research", "pharmaceuticals", "life sciences"],
  authors: [{ name: "Biogrofe Team" }],
  creator: "Biogrofe",
  publisher: "Biogrofe",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://biogrofe.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Biogrofe - Biotechnology Directory",
    description: "Discover leading biotechnology companies, research institutions, and industry partners worldwide",
    url: 'https://biogrofe.com',
    siteName: 'Biogrofe',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Biogrofe - Biotechnology Directory',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Biogrofe - Biotechnology Directory",
    description: "Discover leading biotechnology companies, research institutions, and industry partners worldwide",
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
  icon: [
    { url: '/biogrofe.ico', type: 'image/x-icon' },
  ],
},

  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Biogrofe',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Biogrofe" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="manifest" href="/manifest.json" />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
