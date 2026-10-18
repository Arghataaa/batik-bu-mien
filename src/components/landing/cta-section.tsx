"use client";

import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/ui-store";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  const openLogin = useUIStore((s) => s.openLogin);
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-8 sm:p-12"
        >
          <div className="absolute inset-0 -z-10 batik-pattern opacity-60" />
          <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl space-y-3">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Mulai Kelola Toko Batik Anda
              </h2>
              <p className="text-muted-foreground">
                Admin Batik Bu Mien menyediakan POS kasir, manajemen katalog,
                pelacakan stok, laporan, dan insights — semua dalam satu tempat.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={openLogin}
                className="bg-primary text-primary-foreground"
              >
                Masuk Sekarang
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
