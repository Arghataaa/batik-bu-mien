"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/shop/cart-provider";
import { formatRupiah } from "@/lib/format";
import { useState } from "react";

export function CartDrawer() {
  const cart = useCart();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {cart.count > 0 && (
            <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
              {cart.count}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-96 flex flex-col">
        <SheetHeader>
          <SheetTitle>Keranjang</SheetTitle>
        </SheetHeader>
        {!cart.items.length ? (
          <p className="text-muted-foreground">Keranjang kosong.</p>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {cart.items.map((item) => (
                <div key={item.variantId} className="flex gap-4 border-b pb-4">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-20 w-20 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.variantLabel || item.sku}
                    </p>
                    <p className="text-sm font-semibold mt-1">
                      {formatRupiah(item.price)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          cart.update(item.variantId, item.quantity - 1)
                        }
                      >
                        −
                      </Button>
                      <span className="w-8 text-center text-sm">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          cart.update(item.variantId, item.quantity + 1)
                        }
                      >
                        +
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cart.remove(item.variantId)}
                      >
                        Hapus
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between">
                <span className="font-semibold">Total:</span>
                <span className="font-semibold text-accent">
                  {formatRupiah(cart.total)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Ongkir ditentukan admin sebelum pembayaran.
              </p>
              <Link href="/checkout" onClick={() => setOpen(false)}>
                <Button className="w-full">Checkout</Button>
              </Link>
              <Link href="/keranjang" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full">
                  Lihat Keranjang Lengkap
                </Button>
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
