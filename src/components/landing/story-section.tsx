"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Heart, Leaf, Users, Spade } from "lucide-react";

const pillars = [
  {
    icon: Heart,
    title: "Dibuat Penuh Kasih",
    desc: "Setiap helai dijahit tangan oleh pengrajin lokal dengan perhatian penuh.",
  },
  {
    icon: Spade,
    title: "Warisan Motif",
    desc: "Motif kawung, parang, sidomukti, dan mega mendung dihidupkan kembali.",
  },
  {
    icon: Leaf,
    title: "Bahan Pilihan",
    desc: "Katun premium & rayon adem yang nyaman dipakai seharian.",
  },
  {
    icon: Users,
    title: "Mendukung UMKM",
    desc: "Pembelian Anda langsung menopang keluarga pengrakin dan penenun lokal.",
  },
];

export function StorySection() {
  return (
    <section id="cerita" className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Cerita Kami
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Warisan Motif Bertemu Gaya Modern
            </h2>
            <p className="text-muted-foreground">
              Batik Bu Mien lahir dari rumah sederhana: Bu Mien, seorang perancang
              keluarga, melestarikan motif batik warisan eyang dengan menjahitnya
              menjadi pakaian siap pakai — kemeja, daster, sarung, sorban, dan
              blangkon yang bisa langsung dipakai untuk acara sehari-hari maupun
              istimewa.
            </p>
            <p className="text-muted-foreground">
              Kami percaya batik bukan hanya kain, melainkan cerita. Maka setiap
              produk diberi motif dan nama yang bermakna — dijahit modern untuk
              generasi hari ini.
            </p>
            <div className="inline-flex items-center gap-3 rounded-lg border border-gold/40 bg-card px-4 py-3">
              <span className="text-2xl font-bold text-gold">15+</span>
              <span className="text-sm text-muted-foreground">
                tahun melestarikan motif warisan
              </span>
            </div>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2">
            {pillars.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
              >
                <Card className="h-full gap-3 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold">{p.title}</h3>
                    <p className="text-sm text-muted-foreground">{p.desc}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
