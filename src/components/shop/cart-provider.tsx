"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = { productId: string; variantId: string; name: string; sku: string; price: number; imageUrl?: string | null; variantLabel?: string; quantity: number; stock: number };
type CartContextValue = { items: CartItem[]; count: number; total: number; add: (item: CartItem) => void; update: (variantId: string, quantity: number) => void; remove: (variantId: string) => void; clear: () => void };
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => { try { const raw = localStorage.getItem("batik-cart"); if (raw) setItems(JSON.parse(raw)); } catch {} }, []);
  useEffect(() => { localStorage.setItem("batik-cart", JSON.stringify(items)); }, [items]);
  const value = useMemo(() => ({
    items, count: items.reduce((n, i) => n + i.quantity, 0), total: items.reduce((n, i) => n + i.price * i.quantity, 0),
    add: (item: CartItem) => setItems(prev => { const found = prev.find(i => i.variantId === item.variantId); if (found) return prev.map(i => i.variantId === item.variantId ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.stock) } : i); return [...prev, { ...item, quantity: Math.min(item.quantity, item.stock) }]; }),
    update: (id: string, quantity: number) => setItems(prev => prev.map(i => i.variantId === id ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) } : i)),
    remove: (id: string) => setItems(prev => prev.filter(i => i.variantId !== id)), clear: () => setItems([]),
  }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() { const value = useContext(CartContext); if (!value) throw new Error("useCart must be used inside CartProvider"); return value; }
