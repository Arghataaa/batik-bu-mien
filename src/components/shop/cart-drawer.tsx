"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Minus,
  PackageOpen,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/shop/cart-provider";
import { formatRupiah } from "@/lib/format";

export function CartDrawer() {
  const cart = useCart();
  const [open, setOpen] = useState(false);

  function continueShopping() {
    setOpen(false);
    window.setTimeout(() => {
      document.getElementById("katalog")?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={`Buka keranjang, ${cart.count} item`}
          className="relative h-10 w-10 rounded-lg border-[#ddc5aa] bg-[#fffaf2] text-[#57351f] hover:bg-[#f8eedf]"
        >
          <ShoppingBag className="h-5 w-5" />
          {cart.count > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#b9532e] px-1 text-[11px] font-bold text-white ring-2 ring-[#fffaf2]">
              {cart.count > 99 ? "99+" : cart.count}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="flex h-[100dvh] w-[min(100%,460px)] flex-col gap-0 border-l-[#ead8c2] bg-[#fffaf2] p-0 shadow-2xl"
      >
        <SheetHeader className="sticky top-0 z-10 flex-row items-center justify-between border-b border-[#ead8c2] bg-[#fffaf2] px-5 py-4 text-left">
          <SheetTitle className="flex items-center gap-2 text-lg font-semibold text-[#3d281a]">
            <ShoppingBag className="h-5 w-5 text-[#ab633a]" />
            Keranjang Belanja
            <span className="rounded-full bg-[#f1dfc8] px-2 py-0.5 text-xs font-semibold text-[#754526]">{cart.count}</span>
          </SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" aria-label="Tutup keranjang" className="h-10 w-10 rounded-full text-[#704326] hover:bg-[#f4e7d6]">
              <X className="h-5 w-5" />
            </Button>
          </SheetClose>
        </SheetHeader>

        {!cart.items.length ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#f4e6d3] text-[#a75c34]">
              <PackageOpen className="h-9 w-9" />
            </div>
            <h2 className="text-lg font-semibold text-[#3d281a]">Keranjangmu masih kosong</h2>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#88684f]">Temukan koleksi batik siap pakai favoritmu dan tambahkan ke keranjang.</p>
            <Button onClick={continueShopping} className="mt-6 h-11 rounded-lg bg-[#754526] px-6 text-white hover:bg-[#5d351d]">Mulai Belanja</Button>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-3">
              <div className="divide-y divide-[#ead8c2]">
                {cart.items.map((item) => {
                  const atMinimum = item.quantity <= 1;
                  const atMaximum = item.quantity >= item.stock;
                  return (
                    <article key={item.variantId} className="flex gap-3 py-4 first:pt-2">
                      <img
                        src={item.imageUrl || "/landing/kemeja-batik.png"}
                        alt={item.name}
                        className="h-[76px] w-[76px] shrink-0 rounded-xl border border-[#ead8c2] bg-[#f4e6d3] object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm font-semibold leading-5 text-[#3d281a]">{item.name}</p>
                            <p className="mt-0.5 truncate text-xs text-[#8b6b52]">{item.variantLabel || item.sku}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Hapus ${item.name}`}
                            onClick={() => cart.remove(item.variantId)}
                            className="h-8 w-8 shrink-0 rounded-full text-[#a17961] hover:bg-[#f8e4df] hover:text-[#b94e35]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-[#b3532d]">{formatRupiah(item.price)}</p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex h-9 items-center rounded-lg border border-[#ddc5aa] bg-white">
                            <Button variant="ghost" size="icon" aria-label={`Kurangi jumlah ${item.name}`} disabled={atMinimum} onClick={() => cart.update(item.variantId, item.quantity - 1)} className="h-8 w-8 rounded-md text-[#6f442a] hover:bg-[#f6eadc] disabled:opacity-35"><Minus className="h-3.5 w-3.5" /></Button>
                            <span className="w-8 text-center text-sm font-semibold tabular-nums text-[#3d281a]">{item.quantity}</span>
                            <Button variant="ghost" size="icon" aria-label={`Tambah jumlah ${item.name}`} disabled={atMaximum} onClick={() => cart.update(item.variantId, item.quantity + 1)} className="h-8 w-8 rounded-md text-[#6f442a] hover:bg-[#f6eadc] disabled:opacity-35"><Plus className="h-3.5 w-3.5" /></Button>
                          </div>
                          <span className="text-sm font-semibold tabular-nums text-[#3d281a]">{formatRupiah(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <footer className="shrink-0 border-t border-[#ead8c2] bg-[#fffaf2] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-8px_25px_rgba(80,48,27,0.06)]">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-[#806048]"><span>Subtotal produk</span><span className="font-medium text-[#3d281a]">{formatRupiah(cart.total)}</span></div>
                <div className="flex justify-between text-[#806048]"><span>Ongkos kirim</span><span>Dihitung saat checkout</span></div>
                <div className="mt-3 flex justify-between border-t border-dashed border-[#dfc8b0] pt-3 text-base font-bold text-[#3d281a]"><span>Total sementara</span><span className="text-[#a84f2c]">{formatRupiah(cart.total)}</span></div>
              </div>
              <Link href="/checkout" onClick={() => setOpen(false)} className="mt-4 block">
                <Button className="h-11 w-full rounded-lg bg-[#754526] text-base font-semibold text-white hover:bg-[#5d351d]">Checkout</Button>
              </Link>
              <Button variant="ghost" onClick={continueShopping} className="mt-1 h-10 w-full rounded-lg text-[#754526] hover:bg-[#f4e7d6]">Lanjut Belanja</Button>
            </footer>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
