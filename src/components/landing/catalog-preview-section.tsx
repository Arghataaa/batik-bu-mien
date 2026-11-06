"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatRupiah } from "@/lib/format";
import {
  Search,
  ShoppingCart,
  Eye,
  X,
  Package,
  CheckCircle2,
  AlertCircle,
  Filter,
  Plus,
  Minus,
  ShieldCheck,
} from "lucide-react";
import { useCart } from "@/components/shop/cart-provider";
import { toast } from "sonner";

type DBVariant = {
  id: string;
  sku: string;
  size?: string | null;
  color?: string | null;
  motif?: string | null;
  stock: number;
};

type DBProduct = {
  id: string;
  name: string;
  sku?: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  category?: { name: string; slug?: string };
  variants: DBVariant[];
};

type DisplayProduct = {
  id: string;
  name: string;
  sku: string;
  categoryName: string;
  description?: string;
  price: number;
  imageUrl: string;
  totalStock: number;
  variants: DBVariant[];
};

export function CatalogPreviewSection() {
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [priceFilter, setPriceFilter] = useState<string>("all");

  // Modal State
  const [detailProduct, setDetailProduct] = useState<DisplayProduct | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  const cart = useCart();

  useEffect(() => {
    fetch("/api/store/products")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: DBProduct[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: DisplayProduct[] = data.map((p) => {
            const totalStock = p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) ?? 0;
            return {
              id: p.id,
              name: p.name,
              sku: p.sku || p.variants?.[0]?.sku || "BBM-PROD",
              categoryName: p.category?.name || "Batik Siap Pakai",
              description: p.description || undefined,
              price: p.price,
              imageUrl: p.imageUrl || "/landing/kemeja-batik.png",
              totalStock,
              variants: p.variants || [],
            };
          });
          setProducts(mapped);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    const handleCategoryEvent = (e: Event) => {
      const custom = e as CustomEvent<string>;
      if (custom.detail) {
        setSelectedCategory(custom.detail);
      }
    };
    window.addEventListener("batik-filter-category", handleCategoryEvent);
    return () => window.removeEventListener("batik-filter-category", handleCategoryEvent);
  }, []);

  const availableCategories = useMemo(() => {
    const set = new Set<string>(["Semua"]);
    products.forEach((p) => {
      if (p.categoryName) set.add(p.categoryName);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categoryName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === "Semua" ||
        p.categoryName.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        selectedCategory.toLowerCase().includes(p.categoryName.toLowerCase());

      let matchesPrice = true;
      if (priceFilter === "under-150") matchesPrice = p.price < 150000;
      else if (priceFilter === "150-250") matchesPrice = p.price >= 150000 && p.price <= 250000;
      else if (priceFilter === "above-250") matchesPrice = p.price > 250000;

      return matchesSearch && matchesCat && matchesPrice;
    });
  }, [products, searchQuery, selectedCategory, priceFilter]);

  // Selected variant in detail modal
  const currentVariant = useMemo(() => {
    if (!detailProduct) return null;
    return detailProduct.variants.find((v) => v.id === selectedVariantId) || detailProduct.variants[0] || null;
  }, [detailProduct, selectedVariantId]);

  const currentStock = currentVariant ? currentVariant.stock : (detailProduct?.totalStock ?? 0);

  function openDetail(p: DisplayProduct) {
    setDetailProduct(p);
    const firstAvail = p.variants.find((v) => v.stock > 0) || p.variants[0];
    setSelectedVariantId(firstAvail ? firstAvail.id : "");
    setQuantity(1);
  }

  function handleVariantChange(variantId: string) {
    setSelectedVariantId(variantId);
    setQuantity(1);
  }

  function handleQuantityChange(delta: number) {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > currentStock) return currentStock;
      return next;
    });
  }

  function handleAddToCart(p: DisplayProduct, variant?: DBVariant, qty: number = 1) {
    const targetVariant = variant || p.variants.find((v) => v.stock > 0) || p.variants[0];

    if (!targetVariant || targetVariant.stock <= 0) {
      toast.error("Maaf, ukuran/varian ini sedang habis.");
      return;
    }

    const finalQty = Math.min(Math.max(1, qty), targetVariant.stock);

    const variantLabel =
      (targetVariant.size ? `Ukuran: ${targetVariant.size}` : null) ||
      [targetVariant.color, targetVariant.motif].filter(Boolean).join(" / ") ||
      "Standar";

    cart.add({
      productId: p.id,
      variantId: targetVariant.id,
      name: p.name,
      sku: targetVariant.sku,
      price: p.price,
      imageUrl: p.imageUrl,
      variantLabel,
      quantity: finalQty,
      stock: targetVariant.stock,
    });

    toast.success(
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-[#2B1A0E]">Produk berhasil ditambahkan ke keranjang</span>
        <span className="text-xs text-[#8A6B4A]">
          {p.name} · {variantLabel} ({finalQty} buah)
        </span>
      </div>,
      { id: `cart-${targetVariant.id}`, duration: 2800 }
    );
  }

  return (
    <section id="katalog" className="border-b border-[#D9C19B] bg-[#FFF9EE] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#B5532A]">
            Katalog Pilihan
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#2B1A0E] sm:text-4xl">
            Koleksi Batik Siap Pakai
          </h2>
          <p className="mt-3 text-base text-[#6A4E36]">
            Temukan motif klasik parang, kawung, sidomukti, hingga mega mendung. Harga terjangkau dengan jahitan berkualitas.
          </p>
        </div>

        {/* Filter bar */}
        <div className="mt-10 rounded-2xl border border-[#D9C19B] bg-[#FAF3E5] p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A6B4A]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari motif atau nama produk..."
                className="pl-9 pr-9 h-10 border-[#D9C19B] bg-white text-[#2B1A0E] placeholder:text-[#8A6B4A]/60 focus-visible:ring-[#B5532A]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A6B4A] hover:text-[#2B1A0E]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Price filter */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Filter className="h-4 w-4 text-[#8A6B4A]" />
              <span className="text-xs font-semibold text-[#6B3F1D]">Harga:</span>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="h-10 rounded-lg border border-[#D9C19B] bg-white px-3 text-xs font-medium text-[#2B1A0E] focus:outline-hidden focus:ring-2 focus:ring-[#B5532A]"
              >
                <option value="all">Semua Harga</option>
                <option value="under-150">&lt; Rp 150.000</option>
                <option value="150-250">Rp 150.000 - Rp 250.000</option>
                <option value="above-250">&gt; Rp 250.000</option>
              </select>
            </div>
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scroll-soft pt-1">
            {availableCategories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                    active
                      ? "bg-[#6B3F1D] text-[#FAF3E5] shadow-xs"
                      : "bg-[#FFF9EE] border border-[#D9C19B] text-[#4A2E14] hover:bg-[#EAD9B8]"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        <div className="mt-8">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="h-96 rounded-2xl border border-[#D9C19B]/60 bg-[#FAF3E5]/60 animate-pulse"
                />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D9C19B] bg-[#FAF3E5] p-12 text-center">
              <Package className="mx-auto h-12 w-12 text-[#8A6B4A]" />
              <h3 className="mt-4 text-base font-bold text-[#2B1A0E]">
                Tidak ada produk ditemukan
              </h3>
              <p className="mt-1 text-xs text-[#8A6B4A]">
                Coba ubah kata kunci pencarian atau reset filter kategori & harga.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("Semua");
                  setPriceFilter("all");
                }}
                className="mt-4 border-[#D9C19B] bg-white text-[#6B3F1D]"
              >
                Reset Filter
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((p, i) => {
                const isOutOfStock = p.totalStock <= 0;

                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.3) }}
                  >
                    <Card className="group flex flex-col h-full overflow-hidden rounded-2xl border border-[#D9C19B] bg-[#FFF9EE] shadow-xs hover:border-[#B5532A] hover:shadow-md transition-all duration-300">
                      {/* Image container */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#E8D6B5]">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                            isOutOfStock ? "grayscale-50 opacity-80" : ""
                          }`}
                          loading="lazy"
                        />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                          <span className="rounded-md bg-[#FAF3E5]/90 px-2.5 py-1 text-[11px] font-bold text-[#6B3F1D] backdrop-blur shadow-xs">
                            {p.categoryName}
                          </span>
                        </div>

                        {/* Stock Badge */}
                        <div className="absolute top-3 right-3">
                          {isOutOfStock ? (
                            <span className="rounded-md bg-[#B33A2A] px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
                              Stok Habis
                            </span>
                          ) : (
                            <span className="rounded-md bg-[#FAF3E5]/90 px-2.5 py-1 text-[11px] font-semibold text-[#4A2E14] backdrop-blur">
                              Stok: {p.totalStock}
                            </span>
                          )}
                        </div>

                        {/* Quick View Button Overlay */}
                        <button
                          onClick={() => openDetail(p)}
                          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#FAF3E5] text-[#2B1A0E] opacity-90 shadow-md transition-all hover:bg-[#6B3F1D] hover:text-white"
                          title="Lihat Detail Produk"
                          aria-label={`Detail ${p.name}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                        <div>
                          <h3
                            onClick={() => openDetail(p)}
                            className="font-bold text-base text-[#2B1A0E] cursor-pointer hover:text-[#B5532A] transition-colors line-clamp-1"
                          >
                            {p.name}
                          </h3>

                          {p.description && (
                            <p className="mt-1 text-xs text-[#8A6B4A] line-clamp-2 leading-relaxed">
                              {p.description}
                            </p>
                          )}

                          {p.variants.length > 0 && (
                            <div className="mt-2.5 flex flex-wrap gap-1">
                              {p.variants.slice(0, 5).map((v) => (
                                <span
                                  key={v.id}
                                  className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${
                                    v.stock > 0
                                      ? "border-[#D9C19B] bg-[#FAF3E5] text-[#4A2E14]"
                                      : "border-dashed border-[#D9C19B]/60 bg-[#FAF3E5]/40 text-[#8A6B4A]/60 line-through"
                                  }`}
                                >
                                  {v.size || v.sku.split("-").pop()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#E8D6B5]">
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="text-xs text-[#8A6B4A]">Harga</span>
                            <span className="text-base font-extrabold text-[#B5532A]">
                              {formatRupiah(p.price)}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDetail(p)}
                              className="border-[#D9C19B] bg-white text-[#4A2E14] hover:bg-[#FAF3E5] text-xs h-9"
                            >
                              Detail
                            </Button>

                            <Button
                              size="sm"
                              disabled={isOutOfStock}
                              onClick={() => openDetail(p)}
                              className={`gap-1.5 text-xs h-9 ${
                                isOutOfStock
                                  ? "bg-[#D9C19B]/60 text-[#8A6B4A] cursor-not-allowed"
                                  : "bg-[#6B3F1D] text-[#FAF3E5] hover:bg-[#522E13]"
                              }`}
                            >
                              <ShoppingCart className="h-3.5 w-3.5" />
                              <span>{isOutOfStock ? "Habis" : "Pilih Ukuran"}</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MATCHED REFERENCE UI MODAL — STITCH UX REDESIGN OPTIMIZATION     */}
      {/* ============================================================== */}
      <Dialog open={!!detailProduct} onOpenChange={(open) => !open && setDetailProduct(null)}>
        <DialogContent className="w-[96vw] max-w-5xl p-0 overflow-hidden border border-[#D9C19B] bg-[#FBF7F0] text-[#2A1A10] shadow-[0_25px_60px_-15px_rgba(30,15,8,0.55)] rounded-3xl max-h-[92vh] flex flex-col">
          {detailProduct && (
            <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto lg:overflow-hidden">
              {/* ==================== LEFT COLUMN: Product Visual Gallery (5 cols) ==================== */}
              <aside className="lg:col-span-5 bg-[#F5ECE1]/60 p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-[#E8DCCF] flex flex-col justify-between">
                <div>
                  {/* Main Featured Image Canvas */}
                  <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-lg border border-[#E8DCCF] bg-white group">
                    <img
                      src={detailProduct.imageUrl}
                      alt={detailProduct.name}
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Badges Overlay */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                      <span className="bg-[#3D2214]/90 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm tracking-wide">
                        {detailProduct.categoryName}
                      </span>
                      <span className="bg-emerald-700/90 backdrop-blur-md text-white text-[11px] font-medium px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
                        ✓ 100% Asli Batik
                      </span>
                    </div>
                  </div>

                  {/* Detail Motif & Jahitan Box */}
                  <div className="mt-4 p-4 bg-white/90 rounded-2xl border border-[#E8DCCF] shadow-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-3.5 bg-[#9E4A28] rounded-full"></span>
                      <h3 className="text-xs font-bold text-[#2A1A10] uppercase tracking-wider">Detail Motif & Jahitan</h3>
                    </div>
                    <p className="text-xs text-[#7A695E] leading-relaxed">
                      Dibuat secara teliti dengan motif autentik nusantara dan jahitan rapi berstandar butik siap pakai untuk kenyamanan maksimal.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#F5ECE1] text-[#7F3619] text-[11px] font-semibold border border-[#E8DCCF]">
                        ✓ Motif Autentik
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#F5ECE1] text-[#7F3619] text-[11px] font-semibold border border-[#E8DCCF]">
                        ✓ Kain Adem Nyaman
                      </span>
                    </div>
                  </div>
                </div>

                {/* Artisan Local Proof Callout */}
                <div className="mt-6 pt-4 border-t border-[#E8DCCF] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100/90 border border-amber-200 text-[#7F3619] flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-[#2A1A10] block">Karya Pengrajin Lokal Bantul</span>
                    <span className="text-[#7A695E]">Koleksi pilihan langsung dari Yogyakarta</span>
                  </div>
                </div>
              </aside>

              {/* ==================== RIGHT COLUMN: Product Config & Purchase (7 cols) ==================== */}
              <div className="lg:col-span-7 flex flex-col justify-between bg-[#FBF7F0] overflow-y-auto custom-scrollbar">
                {/* Modal Content Body */}
                <div className="p-6 lg:p-8 space-y-6">
                  {/* Top Header: Badge, Code & Close Button */}
                  <header className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-amber-100/90 text-[#7F3619] border border-amber-200 uppercase">
                        {detailProduct.categoryName}
                      </span>
                      <span className="text-xs text-[#7A695E] font-medium">
                        Kode: <span className="font-mono text-[#2A1A10] font-semibold tracking-wider">{currentVariant?.sku || detailProduct.sku}</span>
                      </span>
                    </div>

                    {/* Close Modal Icon Button */}
                    <button
                      aria-label="Tutup Detail Produk"
                      onClick={() => setDetailProduct(null)}
                      className="w-9 h-9 rounded-full bg-[#F5ECE1] hover:bg-[#E8DCCF] text-[#3D2214] flex items-center justify-center transition-colors focus:outline-none"
                      type="button"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </header>

                  {/* Title, Price & Stock Status */}
                  <section className="space-y-3">
                    <h1 className="font-serif text-3xl lg:text-4xl font-bold text-[#2A1A10] tracking-tight">
                      {detailProduct.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3.5 pt-1">
                      <span className="text-3xl font-extrabold text-[#9E4A28] tracking-tight">
                        {formatRupiah(detailProduct.price)}
                      </span>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-100/70 border border-orange-200 text-[#7F3619] text-xs font-semibold">
                        <AlertCircle className="h-4 w-4 text-[#9E4A28]" />
                        <span>
                          {currentStock > 0 ? `Stok Tersedia (sisa ${currentStock})` : "Stok Habis"}
                        </span>
                      </div>
                    </div>
                  </section>

                  {/* Product Description */}
                  <section className="text-sm text-[#7A695E] leading-relaxed">
                    <p>
                      {detailProduct.description ||
                        "Batik siap pakai berkualitas dengan motif autentik warisan leluhur. Dijahit rapi dengan pola potongan modern yang nyaman, menggunakan serat katun adem yang menyerap keringat dan tidak mudah kusut untuk acara formal maupun kasual."}
                    </p>
                  </section>

                  {/* Specifications Grid: 4 Clean Desktop Cards */}
                  <section className="bg-[#F5ECE1]/80 rounded-2xl p-4 border border-[#E8DCCF] grid grid-cols-2 gap-x-5 gap-y-3.5 text-xs lg:text-sm">
                    <div>
                      <span className="text-[#7A695E] text-xs block mb-0.5">Kategori</span>
                      <span className="font-semibold text-[#2A1A10]">{detailProduct.categoryName}</span>
                    </div>
                    <div>
                      <span className="text-[#7A695E] text-xs block mb-0.5">Asal Produksi</span>
                      <span className="font-semibold text-[#2A1A10]">Bantul, D.I. Yogyakarta</span>
                    </div>
                    <div>
                      <span className="text-[#7A695E] text-xs block mb-0.5">Bahan Kain</span>
                      <span className="font-semibold text-[#2A1A10]">Katun Primissima Halus</span>
                    </div>
                    <div>
                      <span className="text-[#7A695E] text-xs block mb-0.5">Kualitas Jahitan</span>
                      <span className="font-semibold text-[#2A1A10]">Standar Butik Siap Pakai</span>
                    </div>
                  </section>

                  {/* Divider */}
                  <hr className="border-[#E8DCCF]/80" />

                  {/* ==================== SIZE SELECTION SECTION ==================== */}
                  {detailProduct.variants.length > 0 && (
                    <section className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <h2 className="text-xs lg:text-sm font-bold uppercase tracking-wider text-[#2A1A10]">
                            Pilih Ukuran
                          </h2>
                          <span className="text-red-600 font-bold">*</span>
                        </div>
                      </div>

                      {/* Size Chips Selector Grid */}
                      <div className="grid grid-cols-5 gap-2.5">
                        {detailProduct.variants.map((v) => {
                          const active = selectedVariantId === v.id;
                          const isOut = v.stock <= 0;
                          const sizeLabel = v.size || v.sku.split("-").pop() || "S";

                          if (isOut) {
                            return (
                              <div
                                key={v.id}
                                className="relative h-14 rounded-xl flex flex-col items-center justify-center border border-dashed border-stone-300 bg-stone-100 text-stone-400 select-none overflow-hidden cursor-not-allowed"
                              >
                                <span className="line-through decoration-stone-400 font-bold text-base leading-none">
                                  {sizeLabel}
                                </span>
                                <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded mt-0.5">
                                  Habis
                                </span>
                              </div>
                            );
                          }

                          return (
                            <label key={v.id} className="cursor-pointer relative">
                              <input
                                type="radio"
                                name="product_size_radio"
                                checked={active}
                                onChange={() => handleVariantChange(v.id)}
                                className="peer sr-only"
                              />
                              <div
                                className={`h-14 rounded-xl flex flex-col items-center justify-center border font-semibold text-sm transition-all shadow-sm ${
                                  active
                                    ? "border-[#9E4A28] bg-[#9E4A28] text-white ring-2 ring-[#9E4A28]/30 shadow-md"
                                    : "border-[#E8DCCF] bg-white/90 hover:bg-white text-[#2A1A10] hover:border-[#9E4A28]"
                                }`}
                              >
                                <span className="text-base font-extrabold leading-none">{sizeLabel}</span>
                                <span className={`text-[10px] mt-1 ${active ? "text-white/90" : "text-[#7A695E]"}`}>
                                  {v.stock <= 3 ? `Sisa ${v.stock}` : "Tersedia"}
                                </span>
                              </div>
                              {active && (
                                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#3D2214] text-white rounded-full flex items-center justify-center text-xs shadow-md border-2 border-[#FBF7F0]">
                                  ✓
                                </div>
                              )}
                            </label>
                          );
                        })}
                      </div>

                      {/* Live Stock Micro-Feedback for Selected Size */}
                      {currentVariant && (
                        <div className="flex items-center gap-2 pt-1 text-xs text-[#7F3619] bg-amber-50/70 border border-amber-200/60 rounded-xl px-3.5 py-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                          <span className="font-medium">
                            Ukuran terpilih: <strong>{currentVariant.size || currentVariant.sku.split("-").pop()}</strong> • Stok tersisa <strong>{currentVariant.stock} buah</strong>
                          </span>
                        </div>
                      )}
                    </section>
                  )}
                </div>

                {/* ==================== DESKTOP FOOTER / PURCHASE ACTION ROW ==================== */}
                <footer className="bg-white/95 backdrop-blur-md px-6 lg:px-8 py-5 border-t border-[#E8DCCF] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-auto">
                  {/* Left: Quantity Stepper with Subtotal Label */}
                  <div className="flex items-center gap-3.5">
                    <div className="flex items-center bg-[#FBF7F0] rounded-xl border border-[#E8DCCF] p-1 shadow-sm">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={quantity <= 1 || currentStock <= 0}
                        onClick={() => handleQuantityChange(-1)}
                        className="w-9 h-9 rounded-lg bg-white hover:bg-[#E8D6B5]/60 text-[#2A1A10] flex items-center justify-center font-bold transition-all disabled:opacity-40 shadow-xs"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <input
                        type="text"
                        readOnly
                        value={quantity}
                        className="w-11 text-center font-bold text-base bg-transparent border-0 text-[#2A1A10] focus:ring-0 p-0"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={quantity >= currentStock || currentStock <= 0}
                        onClick={() => handleQuantityChange(1)}
                        className="w-9 h-9 rounded-lg bg-white hover:bg-[#E8D6B5]/60 text-[#2A1A10] flex items-center justify-center font-bold transition-all shadow-xs"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="hidden sm:flex flex-col justify-center px-3.5 py-1.5 rounded-xl bg-[#F5ECE1]/80 border border-[#E8DCCF]/80 shadow-xs">
                      <span className="text-[#7A695E] uppercase text-[10px] font-bold tracking-wider leading-none mb-0.5">Total Belanja</span>
                      <span className="font-extrabold text-[#9E4A28] text-lg leading-tight tracking-tight">
                        {formatRupiah(detailProduct.price * quantity)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Primary CTA Button (+ Masukkan Keranjang) */}
                  <div className="flex items-center gap-2.5 flex-1 sm:flex-initial sm:justify-end">
                    <Button
                      type="button"
                      disabled={currentStock <= 0}
                      onClick={() => {
                        if (currentVariant) {
                          handleAddToCart(detailProduct, currentVariant, quantity);
                          setDetailProduct(null);
                        }
                      }}
                      className="flex-1 sm:flex-initial h-12 px-6 rounded-xl bg-gradient-to-r from-[#9E4A28] to-[#7F3619] hover:from-[#7F3619] hover:to-[#3D2214] text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-[#9E4A28]/25 transition-all touch-scale"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      <span>{currentStock <= 0 ? "Stok Habis" : "+ Masukkan Keranjang"}</span>
                    </Button>
                  </div>
                </footer>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
