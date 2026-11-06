"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, HeartHandshake } from "lucide-react";

export function HeroSection() {
  function scrollToCatalog() {
    const el = document.getElementById("katalog");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  function scrollToCategories() {
    const el = document.getElementById("kategori");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section
      id="top"
      className="relative isolate overflow-hidden border-b border-[#D9C19B] bg-[#FAF3E5] py-10 sm:py-14 lg:py-16 min-h-[540px] lg:min-h-[580px] flex items-center"
    >
      {/* Background image: hero.png with Tugu Yogyakarta on the right and batik ornaments */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/landing/hero.png"
          alt="Batik Bu Mien - Warisan Motif dengan Latar Tugu Yogyakarta"
          className="h-full w-full object-cover object-right sm:object-center brightness-95 contrast-105"
          loading="eager"
        />
        {/* Soft warm gradient on the left to ensure high text contrast and readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF3E5] via-[#FAF3E5]/85 to-transparent sm:via-[#FAF3E5]/80 sm:to-[#FAF3E5]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAF3E5]/90 via-transparent to-[#FAF3E5]/40" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 w-full">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-4 sm:space-y-5 lg:col-span-8 xl:col-span-7"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C8A04A]/60 bg-[#FFF9EE]/90 px-3.5 py-1 text-xs font-semibold text-[#6B3F1D] shadow-xs backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-[#C8A04A]" />
              <span>Warisan Motif Asli Yogyakarta · Ready-to-Wear Batik</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#2B1A0E] leading-[1.12]">
              Keindahan <span className="text-[#B5532A]">Warisan Motif</span> dalam Balutan Gaya Modern
            </h1>

            <p className="text-sm sm:text-base text-[#5A3B24] leading-relaxed max-w-xl">
              Koleksi batik siap pakai pilihan Bu Mien — kemeja formal, daster nyaman, sarung klasik, sorban, blangkon, hingga selop. Ditenagai motif autentik untuk hari-hari istimewa Anda di Yogyakarta dan Nusantara.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <Button
                size="lg"
                onClick={scrollToCatalog}
                className="bg-[#6B3F1D] text-[#FAF3E5] hover:bg-[#522E13] h-11 px-6 text-sm font-semibold shadow-md gap-2"
              >
                <span>Jelajahi Katalog</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={scrollToCategories}
                className="border-[#D9C19B] bg-[#FFF9EE]/90 text-[#6B3F1D] hover:bg-[#EAD9B8] h-11 px-5 text-sm font-medium backdrop-blur"
              >
                Lihat Kategori
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#D9C19B]/70 max-w-lg">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#B5532A] shrink-0" />
                <span className="text-xs font-medium text-[#4A2E14]">100% Motif Autentik</span>
              </div>
              <div className="flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-[#B5532A] shrink-0" />
                <span className="text-xs font-medium text-[#4A2E14]">Karya Pengrajin Lokal</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#B5532A] shrink-0" />
                <span className="text-xs font-medium text-[#4A2E14]">Bahan Premium Nyaman</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
