'use client'

import { useState } from 'react'
import { LanguageProvider } from '@/lib/i18n/language-context'
import { CartProvider } from '@/lib/cart-context'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CartDrawer } from '@/components/cart-drawer'

export function Providers({ children }: { children: React.ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false)

  return (
    <LanguageProvider>
      <CartProvider>
        <div className="flex min-h-screen flex-col">
          <Header onCartOpen={() => setCartOpen(true)} />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
      </CartProvider>
    </LanguageProvider>
  )
}
