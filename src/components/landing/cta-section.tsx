"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTASection() {
  function scrollToCatalog() {
    const el = document.getElementById("katalog");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="bg-[#FAF3E5] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-[#D9C19B] bg-gradient-to-br from-[#FFF9EE] via-[#FAF3E5] to-[#E8D6B5]/60 p-8 sm:p-14 shadow-lg text-center"
        >
          {/* Subtle batik ornament circle */}
          <div className="absolute -right-16 -bottom-16 h-64 w-64 rounded-full bg-[#B5532A]/5 blur-2xl pointer-events-none" />
          <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-[#C8A04A]/10 blur-2xl pointer-events-none" />

          <div className="relative mx-auto max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D9C19B] bg-white px-3.5 py-1 text-xs font-semibold text-[#6B3F1D]">
              <Sparkles className="h-3.5 w-3.5 text-[#B5532A]" />
              Koleksi Siap Pakai Hari Ini
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-[#2B1A0E] sm:text-4xl lg:text-5xl">
              Temukan Batik Favorit Anda
            </h2>

            <p className="text-base sm:text-lg text-[#6A4E36] leading-relaxed">
              Jelajahi koleksi batik pilihan Bu Mien dengan motif autentik dan kualitas terbaik. Siap menemani langkah Anda dalam setiap momen berharga.
            </p>

            <div className="pt-4 flex justify-center">
              <Button
                size="lg"
                onClick={scrollToCatalog}
                className="bg-[#6B3F1D] text-[#FAF3E5] hover:bg-[#522E13] h-12 px-8 text-base font-semibold shadow-md gap-2"
              >
                <span>Lihat Koleksi</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
