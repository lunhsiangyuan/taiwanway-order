'use client'

import React, { createContext, useContext, useReducer, useEffect, useState } from 'react'
import type { CartItem, OrderableProduct } from './types'

type CartAction =
  | { type: 'ADD'; product: OrderableProduct }
  | { type: 'REMOVE'; productId: string }
  | { type: 'UPDATE_QTY'; productId: string; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'LOAD'; items: CartItem[] }

interface CartContextType {
  items: CartItem[]
  addItem: (product: OrderableProduct) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalAmount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const STORAGE_KEY = 'taiwanway-order-cart'

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'ADD': {
      const existing = state.find(i => i.product.id === action.product.id)
      if (existing) {
        return state.map(i =>
          i.product.id === action.product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...state, { product: action.product, quantity: 1 }]
    }
    case 'REMOVE':
      return state.filter(i => i.product.id !== action.productId)
    case 'UPDATE_QTY':
      if (action.quantity <= 0) return state.filter(i => i.product.id !== action.productId)
      return state.map(i =>
        i.product.id === action.productId ? { ...i, quantity: action.quantity } : i
      )
    case 'CLEAR':
      return []
    case 'LOAD':
      return action.items
    default:
      return state
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, [])
  const [mounted, setMounted] = useState(false)

  // 從 localStorage 載入
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as CartItem[]
        dispatch({ type: 'LOAD', items: parsed })
      }
    } catch { /* ignore */ }
    setMounted(true)
  }, [])

  // 儲存到 localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    }
  }, [items, mounted])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalAmount = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem: (product) => dispatch({ type: 'ADD', product }),
        removeItem: (productId) => dispatch({ type: 'REMOVE', productId }),
        updateQuantity: (productId, quantity) => dispatch({ type: 'UPDATE_QTY', productId, quantity }),
        clearCart: () => dispatch({ type: 'CLEAR' }),
        totalItems,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}
