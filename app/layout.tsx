import type { Metadata } from 'next'
import { Karla, Playfair_Display_SC } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const karla = Karla({
  variable: '--font-body',
  subsets: ['latin'],
})

const playfair = Playfair_Display_SC({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['400', '700', '900'],
})

export const metadata: Metadata = {
  title: '台灣味 線上訂餐 | TaiwanWay Online Order',
  description: '道地台灣美食，線上點餐到店取餐。Authentic Taiwanese cuisine, order online and pick up.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body className={`${karla.variable} ${playfair.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
