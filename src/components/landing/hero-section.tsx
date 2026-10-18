"use client";

import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/ui-store";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  const openLogin = useUIStore((s) => s.openLogin);

  function scrollToCatalog() {
    const el = document.getElementById("katalog");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section
      id="top"
      className="relative isolate overflow-hidden border-b border-border"
    >
      {/* Background image with overlay */}
      <div className="absolute inset-0 -z-10">
        { }
        <img
          src="/landing/hero.png"
          alt="Suasana butik Batik Bu Mien dengan koleksi siap pakai"
          className="h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/75 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
      </div>

      <div className="mx-auto flex max-w-7xl flex-col items-start px-4 py-20 sm:px-6 sm:py-24 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-2xl space-y-6"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-card/70 px-3 py-1 text-xs font-medium text-gold backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Modern Heritage · Ready-to-Wear Batik
          </span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
            Batik Bu Mien —{" "}
            <span className="text-accent">Warisan Motif</span>, Gaya Modern
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl">
            Kemeja batik siap pakai, daster, sarung, sorban, dan blangkon.
            Motif tradisional dijahit modern untuk gaya hidup hari ini.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              size="lg"
              onClick={openLogin}
              className="bg-primary text-primary-foreground"
            >
              Masuk Admin
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={scrollToCatalog}
              className="border-primary/40 text-primary hover:bg-primary/10"
            >
              Lihat Katalog
            </Button>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-3 text-xs text-muted-foreground">
            <span>✓ Kualitas premium</span>
            <span>✓ Motif autentik</span>
            <span>✓ UMKM penuh kasih</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
