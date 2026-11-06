"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/components/shop/cart-provider";
import { formatRupiah } from "@/lib/format";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingFooter } from "@/components/landing/landing-footer";
import { MapPin, PackageCheck, ShoppingBag, UserRound } from "lucide-react";

type FieldProps = {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
};

function Field({ name, label, placeholder, type = "text", required = true }: FieldProps) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-foreground">
      {label}{required && <span className="sr-only"> (wajib)</span>}
      <Input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder || label}
        autoComplete={name === "customerName" ? "name" : name === "customerPhone" ? "tel" : name === "customerEmail" ? "email" : "off"}
        className="h-10 rounded-lg border-[#e6d4bd] bg-white px-3 text-sm placeholder:text-muted-foreground/70 focus-visible:border-[#8b542e] focus-visible:ring-[#8b542e]/20"
      />
    </label>
  );
}

export default function CheckoutPage() {
  const cart = useCart();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    try {
      const raw = localStorage.getItem("batik-checkout-draft");
      if (raw) {
        const draft = JSON.parse(raw) as Record<string, string>;
        Object.entries(draft).forEach(([name, value]) => {
          const field = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;
          if (field && typeof value === "string") field.value = value;
        });
      }
    } catch {
      // Ignore malformed draft.
    }
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    const saveDraft = () => {
      const form = formRef.current;
      if (!form) return;
      const values = Object.fromEntries(new FormData(form).entries());
      localStorage.setItem("batik-checkout-draft", JSON.stringify(values));
    };
    const form = formRef.current;
    form?.addEventListener("input", saveDraft);
    return () => form?.removeEventListener("input", saveDraft);
  }, [draftReady]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading || !cart.items.length) return;
    setLoading(true);
    setError("");

    try {
      const form = new FormData(e.currentTarget);
      const res = await fetch("/api/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(form),
          items: cart.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
            name: item.name,
            sku: item.sku,
            variantLabel: item.variantLabel,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.message || "Pesanan gagal dibuat. Periksa kembali data Anda.");
        setLoading(false);
        return;
      }
      cart.clear();
      localStorage.removeItem("batik-checkout-draft");
      const previous = JSON.parse(localStorage.getItem("batik-order-history") || "[]") as string[];
      localStorage.setItem("batik-order-history", JSON.stringify([data.trackingToken, ...previous.filter((token: string) => token !== data.trackingToken)].slice(0, 20)));
      router.push(`/pesanan/${data.trackingToken}`);
    } catch {
      setError("Koneksi bermasalah. Periksa internet lalu coba lagi.");
      setLoading(false);
    }
  }

  return (
    <>
      <LandingNavbar />
      <main className="flex-1 bg-[#fbf6ee]">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a7683d]">Batik Bu Mien Official Store</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#392719] sm:text-3xl">Checkout</h1>
            <p className="mt-1 text-sm text-muted-foreground">Lengkapi alamat penerima untuk melanjutkan pesanan.</p>
          </div>

          <form ref={formRef} onSubmit={submit} className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-7">
            <div className="space-y-5">
              <section className="rounded-xl border border-[#ead9c4] bg-white p-4 shadow-sm sm:p-6">
                <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[#4a3020]"><UserRound className="h-4 w-4 text-[#a7683d]" />Informasi penerima</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field name="customerName" label="Nama lengkap" placeholder="Nama penerima" />
                  <Field name="customerPhone" label="Nomor WhatsApp" placeholder="08xxxxxxxxxx" type="tel" />
                  <div className="sm:col-span-2"><Field name="customerEmail" label="Email" placeholder="nama@email.com" type="email" /></div>
                </div>
              </section>

              <section className="rounded-xl border border-[#ead9c4] bg-white p-4 shadow-sm sm:p-6">
                <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[#4a3020]"><MapPin className="h-4 w-4 text-[#a7683d]" />Alamat pengiriman</h2>
                <div className="grid gap-3">
                  <label className="grid gap-1.5 text-sm font-medium">
                    Alamat lengkap
                    <Textarea name="address" required rows={2} placeholder="Nama jalan, nomor rumah, RT/RW, dusun atau lingkungan, dan patokan lokasi." className="min-h-20 resize-y rounded-lg border-[#e6d4bd] bg-white text-sm placeholder:text-muted-foreground/70 focus-visible:border-[#8b542e] focus-visible:ring-[#8b542e]/20" />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field name="province" label="Provinsi" placeholder="Contoh: DI Yogyakarta" />
                    <Field name="city" label="Kota/Kabupaten" placeholder="Contoh: Kabupaten Bantul" />
                    <Field name="district" label="Kecamatan" />
                    <Field name="village" label="Kelurahan/Desa" />
                    <Field name="postalCode" label="Kode pos" placeholder="Contoh: 55123" />
                  </div>
                  <label className="grid gap-1.5 text-sm font-medium">
                    Catatan untuk penjual <span className="font-normal text-muted-foreground">(opsional)</span>
                    <Textarea name="note" rows={2} placeholder="Tambahkan catatan untuk penjual, misalnya permintaan packing atau informasi pengiriman." className="min-h-16 resize-y rounded-lg border-[#e6d4bd] bg-white text-sm placeholder:text-muted-foreground/70 focus-visible:border-[#8b542e] focus-visible:ring-[#8b542e]/20" />
                  </label>
                </div>
              </section>
            </div>

            <aside className="lg:sticky lg:top-24">
              <section className="rounded-xl border border-[#ead9c4] bg-white p-4 shadow-sm sm:p-5">
                <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[#4a3020]"><ShoppingBag className="h-4 w-4 text-[#a7683d]" />Ringkasan pesanan <span className="text-sm font-normal text-muted-foreground">({cart.count} produk)</span></h2>
                {cart.items.length ? (
                  <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                    {cart.items.map((item) => (
                      <div key={item.variantId} className="flex gap-3">
                        <img src={item.imageUrl || "/landing/kemeja-batik.png"} alt={item.name} className="h-16 w-16 shrink-0 rounded-lg border border-[#eee1d2] bg-[#fbf6ee] object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-medium text-[#392719]">{item.name}</p>
                          {item.variantLabel && <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.variantLabel}</p>}
                          <div className="mt-1 flex justify-between gap-2 text-xs text-muted-foreground"><span>Jumlah: {item.quantity}</span><span className="font-medium text-[#4a3020]">{formatRupiah(item.price * item.quantity)}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg bg-[#fbf6ee] p-3 text-sm text-muted-foreground">Keranjang masih kosong.</p>
                )}
                <div className="my-4 border-t border-dashed border-[#e6d4bd]" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground"><span>Subtotal produk</span><span className="text-foreground">{formatRupiah(cart.total)}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>Ongkos kirim</span><span className="text-[#a7683d]">Dikonfirmasi admin</span></div>
                  <p className="rounded-lg bg-[#fbf6ee] p-2.5 text-xs leading-relaxed text-[#775333]">Ongkos kirim akan dikonfirmasi oleh admin setelah pesanan dibuat. Pembayaran dibuka setelah total final tersedia.</p>
                  <div className="flex justify-between border-t border-[#eee1d2] pt-3 font-semibold text-[#392719]"><span>Total sementara</span><span>{formatRupiah(cart.total)}</span></div>
                </div>
                {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                <Button type="submit" disabled={loading || !cart.items.length} className="mt-4 h-11 w-full rounded-lg bg-[#744628] font-semibold text-white hover:bg-[#5c361f] disabled:opacity-60">
                  {loading ? (
                    <span className="flex items-center gap-2"><PackageCheck className="h-4 w-4 animate-pulse" />Menyiapkan pembayaran...</span>
                  ) : "Buat Pesanan dan Bayar"}
                </Button>
                <Button type="button" variant="ghost" disabled={loading} onClick={() => { if (window.confirm("Batalkan pengisian checkout? Data form akan dihapus, keranjang tetap tersimpan.")) { localStorage.removeItem("batik-checkout-draft"); formRef.current?.reset(); } }} className="mt-1 w-full text-[#754526] hover:bg-[#f4e7d6]">Batalkan Checkout</Button>
                {loading && (
                  <p className="mt-2 text-center text-xs text-muted-foreground animate-pulse">
                    Pesanan Anda sedang diproses. Mohon tunggu sebentar.
                  </p>
                )}
                <p className="mt-2 text-center text-xs text-muted-foreground">Data Anda digunakan untuk memproses pengiriman.</p>
              </section>
            </aside>
          </form>
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
