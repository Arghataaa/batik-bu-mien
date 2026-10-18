"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Loader2,
  X,
  Printer,
  Shirt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiGet, apiPost } from "@/lib/api";
import { formatRupiah, formatDateTime, variantLabel } from "@/lib/format";
import type { Product, Sale, SaleInput } from "@/lib/types";

type CartItem = {
  productId: string;
  variantId: string;
  name: string;
  sku: string;
  variantLabel: string;
  price: number;
  stock: number;
  qty: number;
};

type PaymentMethod = "CASH" | "QRIS" | "DEBIT" | "TRANSFER";

export function POSSection() {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [paidAmount, setPaidAmount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [receipt, setReceipt] = useState<Sale | null>(null);

  const qc = useQueryClient();
  const productsQ = useQuery({
    queryKey: ["products", "pos-active"],
    queryFn: () => apiGet<Product[]>(`/api/products?active=true`),
  });

  const results = useMemo(() => {
    const list = productsQ.data ?? [];
    if (!search.trim()) return list.slice(0, 50);
    const q = search.trim().toLowerCase();
    return list
      .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 50);
  }, [productsQ.data, search]);

  const total = useMemo(
    () => cart.reduce((acc, it) => acc + it.price * it.qty, 0),
    [cart]
  );
  const paid = parseInt(paidAmount, 10) || 0;
  const change = Math.max(0, paid - total);
  const insufficientCash =
    paymentMethod === "CASH" && paid > 0 && paid < total;

  function addToCart(product: Product, variantId: string) {
    const v = product.variants.find((x) => x.id === variantId);
    if (!v) return;
    const item: CartItem = {
      productId: product.id,
      variantId: v.id,
      name: product.name,
      sku: v.sku || product.sku,
      variantLabel: variantLabel(v),
      price: product.price,
      stock: v.stock,
      qty: 1,
    };
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.variantId === variantId);
      if (idx >= 0) {
        const next = [...prev];
        if (next[idx].qty + 1 > next[idx].stock) {
          toast.error(`Stok tidak cukup (sisa ${next[idx].stock}).`);
          return prev;
        }
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      if (item.stock <= 0) {
        toast.error("Varian ini habis.");
        return prev;
      }
      return [...prev, item];
    });
  }

  function changeQty(variantId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((it) => {
          if (it.variantId !== variantId) return it;
          const nextQty = it.qty + delta;
          if (nextQty <= 0) return { ...it, qty: 0 };
          if (nextQty > it.stock) {
            toast.error(`Stok tidak cukup (sisa ${it.stock}).`);
            return it;
          }
          return { ...it, qty: nextQty };
        })
        .filter((it) => it.qty > 0)
    );
  }

  function removeItem(variantId: string) {
    setCart((prev) => prev.filter((it) => it.variantId !== variantId));
  }

  function clearCart() {
    setCart([]);
    setPaidAmount("");
    setCustomerName("");
    setPaymentMethod("CASH");
  }

  const submitM = useMutation({
    mutationFn: (payload: SaleInput) =>
      apiPost<{ sale: Sale }>("/api/sales", payload).then((r) => r.sale),
    onSuccess: (sale) => {
      setReceipt(sale);
      clearCart();
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      toast.success(`Transaksi ${sale.invoiceNo} berhasil.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleCheckout() {
    if (cart.length === 0) return toast.error("Keranjang masih kosong.");
    if (insufficientCash) return toast.error("Jumlah bayar kurang dari total.");
    if (paymentMethod !== "CASH" && paid < total) {
      return toast.error("Pembayaran non-tunai harus lunas.");
    }
    submitM.mutate({
      items: cart.map((it) => ({
        productId: it.productId,
        variantId: it.variantId,
        quantity: it.qty,
      })),
      paymentMethod,
      paidAmount: paymentMethod === "CASH" ? paid : total,
      customerName: customerName.trim() || null,
      note: null,
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      {/* Product search + results */}
      <div className="space-y-3">
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Cari produk / SKU…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pilih Produk</CardTitle>
            <CardDescription>
              Klik varian untuk menambahkan ke keranjang
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[60vh] overflow-y-auto scroll-soft p-2 space-y-2">
              {productsQ.isLoading ? (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : results.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Tidak ada produk yang cocok.
                </p>
              ) : (
                results.map((p) => (
                  <ProductRow key={p.id} product={p} onAdd={addToCart} />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cart + checkout */}
      <Card className="lg:sticky lg:top-20 lg:h-fit">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Keranjang</CardTitle>
            <CardDescription>{cart.length} item</CardDescription>
          </div>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCart}>
              <Trash2 className="h-4 w-4" />
              Kosongkan
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-[40vh] overflow-y-auto scroll-soft space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
                <ShoppingCart className="h-8 w-8" />
                <p className="text-sm">Keranjang kosong.</p>
              </div>
            ) : (
              cart.map((it) => (
                <div
                  key={it.variantId}
                  className="rounded-md border border-border/70 bg-card/40 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{it.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {it.variantLabel || it.sku}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => removeItem(it.variantId)}
                      aria-label="Hapus"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => changeQty(it.variantId, -1)}
                        aria-label="Kurangi"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <Input
                        className="h-7 w-12 text-center"
                        value={it.qty}
                        readOnly
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => changeQty(it.variantId, 1)}
                        disabled={it.qty >= it.stock}
                        aria-label="Tambah"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatRupiah(it.price * it.qty)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatRupiah(it.price)} × {it.qty} · sisa {it.stock}
                      </p>
                    </div>
                  </div>
                  {it.qty >= it.stock && (
                    <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                      Mencapai batas stok tersedia.
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Checkout */}
          <div className="space-y-3 rounded-md border border-border/60 bg-background p-3">
            <div className="space-y-1.5">
              <Label htmlFor="cust">Nama Pelanggan (opsional)</Label>
              <Input
                id="cust"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Tunai"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Metode Pembayaran</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Tunai (CASH)</SelectItem>
                  <SelectItem value="QRIS">QRIS</SelectItem>
                  <SelectItem value="DEBIT">Debit</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="paid">Jumlah Bayar</Label>
              <Input
                id="paid"
                type="number"
                inputMode="numeric"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder={String(total)}
                disabled={paymentMethod !== "CASH"}
              />
              {insufficientCash && (
                <p className="text-[11px] text-destructive">
                  Pembayaran kurang {formatRupiah(total - paid)}.
                </p>
              )}
            </div>
            <div className="space-y-1 border-t border-border pt-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">{formatRupiah(total)}</span>
              </div>
              {paymentMethod === "CASH" && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Kembalian</span>
                  <span className="font-semibold text-green-700 dark:text-green-400">
                    {formatRupiah(change)}
                  </span>
                </div>
              )}
            </div>
            <Button
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleCheckout}
              disabled={submitM.isPending || cart.length === 0}
            >
              {submitM.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses…
                </>
              ) : (
                "Bayar"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ReceiptDialog sale={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}

function ProductRow({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (p: Product, variantId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const totalStock = product.totalStock ?? product.variants.reduce((a, v) => a + v.stock, 0);
  const single = product.variants.length === 1 ? product.variants[0] : null;
  const outOfStock = totalStock <= 0;

  return (
    <div className="flex items-center gap-3 rounded-md border border-border/60 bg-card/40 p-2">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted">
        {product.imageUrl ? (
           
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Shirt className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{product.name}</p>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{product.sku}</span>
          <span>·</span>
          <span>{formatRupiah(product.price)}</span>
          <Badge variant="outline" className="text-[10px]">
            stok {totalStock}
          </Badge>
        </div>
      </div>
      {single ? (
        <Button
          size="sm"
          onClick={() => onAdd(product, single.id)}
          disabled={outOfStock}
        >
          <Plus className="h-3.5 w-3.5" />
          Tambah
        </Button>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          Pilih Varian
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pilih Varian — {product.name}</DialogTitle>
            <DialogDescription>{product.sku}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {product.variants.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border/60 p-2"
              >
                <div>
                  <p className="text-sm font-medium">
                    {variantLabel(v) || v.sku}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatRupiah(product.price)} · stok {v.stock}
                  </p>
                </div>
                <Button
                  size="sm"
                  disabled={v.stock <= 0}
                  onClick={() => {
                    onAdd(product, v.id);
                    setOpen(false);
                  }}
                >
                  Pilih
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReceiptDialog({
  sale,
  onClose,
}: {
  sale: Sale | null;
  onClose: () => void;
}) {
  const printableRef = useRef<HTMLDivElement>(null);

  // Ensure ref is used (otherwise the print function will be inert).
  useEffect(() => {
    // no-op: just to register the ref usage for lint.
  }, []);

  function handlePrint() {
    const node = printableRef.current;
    if (!node) return;
    const html = node.outerHTML;
    const w = window.open("", "_blank", "width=420,height=720");
    if (!w) {
      toast.error("Pop-up diblokir. Izinkan pop-up untuk mencetak struk.");
      return;
    }
    w.document.write(`
      <html><head><title>Struk ${sale?.invoiceNo ?? ""}</title>
      <style>
        body { font-family: monospace; font-size: 12px; color: #2B1A0E; background: #FFF9EE; padding: 16px; }
        .center { text-align: center; }
        .muted { color: #8A6B4A; }
        .row { display: flex; justify-content: space-between; gap: 8px; padding: 2px 0; }
        .border { border-top: 1px dashed #D9C19B; margin: 8px 0; }
        .right { text-align: right; }
        h2 { font-size: 14px; margin: 4px 0; }
      </style>
      </head><body>${html}</body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
      w.close();
    }, 200);
  }

  return (
    <Dialog open={!!sale} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-accent" />
            Transaksi Berhasil
          </DialogTitle>
          <DialogDescription>
            Struk pembayaran {sale?.invoiceNo}
          </DialogDescription>
        </DialogHeader>

        <div
          ref={printableRef}
          className="rounded-md border border-border bg-card p-4 font-mono text-sm"
        >
          <div className="center text-center">
            <h2 className="font-bold text-base">Batik Bu Mien</h2>
            <p className="muted text-[11px] text-muted-foreground">
              Jl. Kawung No. 12, Yogyakarta
            </p>
            <p className="muted text-[11px] text-muted-foreground">
              +62 274 123 456
            </p>
          </div>
          <div className="border my-2 border-t border-dashed border-border" />
          <div className="text-[11px] text-muted-foreground">
            <div className="flex justify-between">
              <span>No. Invoice</span>
              <span>{sale?.invoiceNo}</span>
            </div>
            <div className="flex justify-between">
              <span>Tanggal</span>
              <span>{sale ? formatDateTime(sale.createdAt) : "-"}</span>
            </div>
            {sale?.customerName && (
              <div className="flex justify-between">
                <span>Pelanggan</span>
                <span>{sale.customerName}</span>
              </div>
            )}
          </div>
          <div className="border my-2 border-t border-dashed border-border" />
          <div className="space-y-1">
            {sale?.items.map((it) => (
              <div key={it.id} className="space-y-0.5">
                <div className="flex justify-between text-[11px]">
                  <span className="truncate">{it.name}</span>
                  <span>{formatRupiah(it.subtotal)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>
                    {it.quantity} × {formatRupiah(it.price)}
                  </span>
                  <span>{it.variantLabel || ""}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="border my-2 border-t border-dashed border-border" />
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatRupiah(sale?.total ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Bayar ({sale?.paymentMethod})
              </span>
              <span>{formatRupiah(sale?.paidAmount ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kembalian</span>
              <span>{formatRupiah(sale?.changeAmount ?? 0)}</span>
            </div>
          </div>
          <div className="border my-2 border-t border-dashed border-border" />
          <div className="text-center text-[10px] text-muted-foreground">
            Terima kasih atas kunjungan Anda 🌸
            <br />
            Selamat menikmati produk batik warisan kami.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Cetak Struk
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
