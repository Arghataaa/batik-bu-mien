"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/format";
import { Tag } from "lucide-react";

type SampleProduct = {
  name: string;
  category: string;
  price: number;
  image: string;
  alt: string;
};

// STATIC showcase samples — product APIs require auth, so the public
// landing page does NOT call them. These illustrate the brand catalog.
const samples: SampleProduct[] = [
  {
    name: "Kemeja Batik Kawung — Cokelat",
    category: "Kemeja Batik",
    price: 285000,
    image: "/landing/kemeja-batik.png",
    alt: "Kemeja batik motif kawung warna cokelat",
  },
  {
    name: "Daster Sidomukti — Terracotta",
    category: "Daster Batik",
    price: 165000,
    image: "/landing/daster-batik.png",
    alt: "Daster batik motif sidomukti warna terracotta",
  },
  {
    name: "Sarung Parang — Cokelat Emas",
    category: "Sarung Batik",
    price: 220000,
    image: "/landing/sarung.png",
    alt: "Sarung batik motif parang warna cokelat emas",
  },
  {
    name: "Sorban Mega Mendung — Krem",
    category: "Sorban Batik",
    price: 145000,
    image: "/landing/sorban.png",
    alt: "Sorban batik motif mega mendung warna krem",
  },
  {
    name: "Blangkon Yogya — Cokelat Emas",
    category: "Blangkon",
    price: 185000,
    image: "/landing/blangkon.png",
    alt: "Blangkon gaya Yogyakarta dengan aksen emas",
  },
  {
    name: "Kemeja Batik — Krem Premium",
    category: "Kemeja Batik",
    price: 320000,
    image: "/landing/kemeja-batik.png",
    alt: "Kemeja batik premium warna krem",
  },
];

export function CatalogPreviewSection() {
  return (
    <section id="katalog" className="border-b border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Pratinjau Katalog
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Pilihan Favorit Pelanggan
          </h2>
          <p className="mt-3 text-muted-foreground">
            Contoh produk dari koleksi kami. Harga ilustrasi; ketersediaan
            terbaru bisa dilihat setelah masuk admin.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {samples.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
            >
              <Card className="group overflow-hidden p-0 py-0 transition-all hover:-translate-y-1 hover:shadow-md">
                <div className="aspect-square overflow-hidden bg-secondary">
                  { }
                  <img
                    src={p.image}
                    alt={p.alt}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {p.category}
                    </Badge>
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium leading-snug">{p.name}</h3>
                  <p className="text-sm font-semibold text-accent">
                    {formatRupiah(p.price)}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
