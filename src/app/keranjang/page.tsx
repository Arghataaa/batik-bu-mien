"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/shop/cart-provider";
import { formatRupiah } from "@/lib/format";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingFooter } from "@/components/landing/landing-footer";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";

export default function CartPage() {
  const cart = useCart();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF3E5]">
      <LandingNavbar />
      <main className="mx-auto max-w-5xl p-4 sm:p-8 flex-1 w-full">
        <div className="flex items-center gap-2.5 pb-6 border-b border-[#D9C19B]">
          <ShoppingBag className="h-6 w-6 text-[#B5532A]" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2B1A0E]">Keranjang Belanja</h1>
          <span className="rounded-full bg-[#E8D6B5] px-2.5 py-0.5 text-xs font-bold text-[#6B3F1D]">
            {cart.count} item
          </span>
        </div>

        {!cart.items.length ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-[#D9C19B] bg-[#FFF9EE] mt-6">
            <ShoppingBag className="mx-auto h-12 w-12 text-[#8A6B4A]" />
            <h2 className="mt-3 text-lg font-bold text-[#2B1A0E]">Keranjang belanja masih kosong</h2>
            <p className="mt-1 text-sm text-[#8A6B4A]">Pilih koleksi batik favorit Anda dan tambahkan ke keranjang.</p>
            <Link href="/#katalog" className="mt-6 inline-block">
              <Button className="bg-[#6B3F1D] text-[#FAF3E5] hover:bg-[#522E13]">
                Mulai Belanja
              </Button>
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid lg:grid-cols-12 gap-8 items-start">
            {/* Daftar Item */}
            <div className="lg:col-span-8 space-y-4">
              {cart.items.map((item) => {
                const atMinimum = item.quantity <= 1;
                const atMaximum = item.quantity >= item.stock;

                return (
                  <div
                    key={item.variantId}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-[#D9C19B] bg-[#FFF9EE] p-4 shadow-xs"
                  >
                    <img
                      src={item.imageUrl || "/landing/kemeja.jpeg"}
                      alt={item.name}
                      className="h-20 w-20 shrink-0 rounded-lg border border-[#D9C19B] bg-[#FAF3E5] object-cover"
                    />

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[#2B1A0E] text-base leading-snug">{item.name}</h3>
                      <p className="text-xs font-medium text-[#B5532A] mt-0.5">
                        {item.variantLabel || item.sku}
                      </p>
                      <p className="text-xs text-[#8A6B4A] mt-1">
                        Harga satuan: <span className="font-semibold text-[#2B1A0E]">{formatRupiah(item.price)}</span>
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E8D6B5]">
                      <div className="flex items-center rounded-lg border border-[#D9C19B] bg-white">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={atMinimum}
                          onClick={() => cart.update(item.variantId, item.quantity - 1)}
                          className="h-8 w-8 text-[#6B3F1D] hover:bg-[#FAF3E5] disabled:opacity-30"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-8 text-center text-xs font-bold text-[#2B1A0E] tabular-nums">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={atMaximum}
                          onClick={() => cart.update(item.variantId, item.quantity + 1)}
                          className="h-8 w-8 text-[#6B3F1D] hover:bg-[#FAF3E5] disabled:opacity-30"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold text-[#B5532A] tabular-nums">
                          {formatRupiah(item.price * item.quantity)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => cart.remove(item.variantId)}
                          className="h-8 w-8 text-[#8A6B4A] hover:text-[#B33A2A] hover:bg-red-50"
                          title="Hapus produk"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ringkasan Subtotal */}
            <div className="lg:col-span-4 rounded-xl border border-[#D9C19B] bg-[#FFF9EE] p-5 shadow-xs space-y-4">
              <h2 className="font-bold text-base text-[#2B1A0E] pb-3 border-b border-[#E8D6B5]">
                Ringkasan Belanja
              </h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-[#8A6B4A]">
                  <span>Total Produk ({cart.count} pcs)</span>
                  <span className="font-semibold text-[#2B1A0E]">{formatRupiah(cart.total)}</span>
                </div>
                <div className="flex justify-between text-[#8A6B4A]">
                  <span>Ongkos Kirim</span>
                  <span className="text-[#B5532A] font-medium text-xs">Dikonfirmasi Admin</span>
                </div>
              </div>

              <div className="pt-3 border-t border-dashed border-[#D9C19B] flex justify-between items-baseline">
                <span className="font-bold text-[#2B1A0E]">Subtotal</span>
                <span className="text-xl font-extrabold text-[#B5532A]">{formatRupiah(cart.total)}</span>
              </div>

              <p className="text-xs text-[#8A6B4A] leading-relaxed bg-[#FAF3E5] p-3 rounded-lg">
                Biaya pengiriman dipilih saat checkout berdasarkan zona wilayah. Total harga (produk + ongkir) langsung terlihat di halaman checkout.
              </p>

              <Link href="/checkout" className="block">
                <Button className="w-full h-11 bg-[#6B3F1D] text-[#FAF3E5] hover:bg-[#522E13] font-semibold gap-2">
                  <span>Lanjut ke Checkout</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link href="/#katalog" className="block text-center">
                <Button variant="ghost" className="w-full text-xs text-[#6B3F1D] hover:bg-[#FAF3E5]">
                  ← Lanjut Belanja Produk Lain
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
      <LandingFooter />
    </div>
  );
}
