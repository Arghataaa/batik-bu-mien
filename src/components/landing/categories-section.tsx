"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ArrowRight, Sparkles } from "lucide-react";

type Cat = {
  name: string;
  desc: string;
  image: string;
  alt: string;
};

const categories: Cat[] = [
  {
    name: "Kemeja Batik",
    desc: "Long-sleeve siap pakai untuk formal & kasual.",
    image: "/landing/kemeja-batik.png",
    alt: "Kemeja batik pria siap pakai",
  },
  {
    name: "Daster Batik",
    desc: "Daster rumah nyaman dengan motif sidomukti.",
    image: "/landing/daster-batik.png",
    alt: "Daster batik wanita",
  },
  {
    name: "Sarung Batik",
    desc: "Sarung dengan motif parang klasik.",
    image: "/landing/sarung.png",
    alt: "Sarung batik motif parang",
  },
  {
    name: "Sorban Batik",
    desc: "Kepala anggun dengan motif mega mendung.",
    image: "/landing/sorban.png",
    alt: "Sorban batik",
  },
  {
    name: "Blangkon",
    desc: "Blangkon gaya Yogyakarta, detail emas.",
    image: "/landing/blangkon.png",
    alt: "Blangkon tradisional",
  },
];

export function CategoriesSection() {
  return (
    <section
      id="kategori"
      className="border-b border-border bg-background batik-pattern"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Koleksi Kami
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Kategori Produk Batik Siap Pakai
          </h2>
          <p className="mt-3 text-muted-foreground">
            Setiap produk dikerjakan dengan motif autentik dan jahitan rapi —
            siap dipakai hari ini.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
            >
              <Card className="group overflow-hidden p-0 py-0 transition-all hover:-translate-y-1 hover:shadow-md">
                <div className="aspect-square overflow-hidden bg-secondary">
                  { }
                  <img
                    src={c.image}
                    alt={c.alt}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-1 p-4">
                  <h3 className="font-semibold">{c.name}</h3>
                  <p className="text-sm text-muted-foreground">{c.desc}</p>
                </div>
              </Card>
            </motion.div>
          ))}

          {/* 6th "Produk Batik Lainnya" card with gold accent */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.45, delay: categories.length * 0.05 }}
          >
            <Card className="group flex h-full flex-col items-start justify-between gap-3 border-gold/50 bg-gradient-to-br from-card to-secondary/40 p-6 transition-all hover:-translate-y-1 hover:shadow-md">
              <div className="space-y-2">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-gold/15 text-gold">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg">Produk Batik Lainnya</h3>
                <p className="text-sm text-muted-foreground">
                  Tunjangan, stola, syal, dan koleksi musiman lainnya. Hubungi
                  kami untuk kustomisasi motif.
                </p>
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-gold">
                Pelajari lebih lanjut
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
