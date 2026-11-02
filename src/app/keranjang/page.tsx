"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/shop/cart-provider";
import { formatRupiah } from "@/lib/format";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingFooter } from "@/components/landing/landing-footer";

export default function CartPage() {
  const cart = useCart();
  return (
    <>
      <LandingNavbar />
      <main className="mx-auto max-w-4xl p-4 sm:p-8 flex-1">
        <h1 className="text-2xl font-bold">Keranjang</h1>
        {!cart.items.length ? (
          <p className="mt-6">Keranjang kosong.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {cart.items.map((item) => (
              <div key={item.variantId} className="flex items-center gap-4 border-b pb-4">
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.variantLabel || item.sku}
                  </p>
                  <p>{formatRupiah(item.price)}</p>
                </div>
                <input
                  className="w-16 rounded border p-2"
                  type="number"
                  min={1}
                  max={item.stock}
                  value={item.quantity}
                  onChange={(e) => cart.update(item.variantId, Number(e.target.value))}
                />
                <p className="w-28 text-right">{formatRupiah(item.price * item.quantity)}</p>
                <Button variant="ghost" onClick={() => cart.remove(item.variantId)}>
                  Hapus
                </Button>
              </div>
            ))}
            <p className="text-right text-lg font-semibold">
              Subtotal: {formatRupiah(cart.total)}
            </p>
            <p className="text-right text-sm text-muted-foreground">
              Ongkir ditentukan admin sebelum pembayaran.
            </p>
            <div className="flex justify-end gap-3">
              <Link href="/">
                <Button variant="outline">Lanjut Belanja</Button>
              </Link>
              <Link href="/checkout">
                <Button>Checkout</Button>
              </Link>
            </div>
          </div>
        )}
      </main>
      <LandingFooter />
    </>
  );
}
