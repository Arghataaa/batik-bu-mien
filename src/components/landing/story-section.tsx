"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Heart, Sparkles, ShieldCheck, Users } from "lucide-react";

const pillars = [
  {
    icon: Sparkles,
    title: "Warisan Motif Autentik",
    desc: "Motif klasik Yogyakarta & Solo seperti Parang, Kawung, Sidomukti, dan Mega Mendung dihadirkan dengan pakem yang terjaga.",
  },
  {
    icon: Heart,
    title: "Jahitan Rapi & Siap Pakai",
    desc: "Bukan sekadar lembaran kain, tiap helai telah dijahit menjadi busana yang presisi, nyaman, dan siap langsung Anda kenakan.",
  },
  {
    icon: ShieldCheck,
    title: "Bahan Katun & Rayon Pilihan",
    desc: "Menggunakan serat kain adem, menyerap keringat, dan tidak mudah susut saat dicuci, cocok untuk iklim tropis Indonesia.",
  },
  {
    icon: Users,
    title: "Menopang Pengrajin Lokal",
    desc: "Setiap pesanan Anda turut memberdayakan keluarga penenun, pembatik cap, dan penjahit lokal di Kasihan, Bantul.",
  },
];

export function StorySection() {
  return (
    <section id="cerita" className="border-b border-[#D9C19B] bg-[#FAF3E5] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="space-y-6 lg:col-span-6"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#B5532A]">
                Cerita Kami
              </span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#2B1A0E] sm:text-4xl">
                Batik Bu Mien: Cinta pada Warisan Leluhur
              </h2>
            </div>

            <p className="text-base text-[#6A4E36] leading-relaxed">
              Batik Bu Mien berawal dari rumah sederhana di Tirtonirmolo, Kasihan, Bantul. Bu Mien mendedikasikan ketelatenannya untuk menjaga filosofi motif batik klasik nusantara agar tidak pudar di tengah zaman modern.
            </p>

            <p className="text-base text-[#6A4E36] leading-relaxed">
              Bagi kami, batik bukan sekadar pakaian seragam atau lembaran kain tradisi. Batik adalah rekaman doa, kesabaran jemari pembatik, dan warisan budaya yang pantas dipakai dengan penuh kebanggaan dalam keseharian generasi masa kini.
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              <div className="rounded-xl border border-[#D9C19B] bg-[#FFF9EE] p-4 shadow-xs">
                <span className="block text-2xl font-extrabold text-[#6B3F1D]">15+ Tahun</span>
                <span className="text-xs text-[#8A6B4A]">Menjaga Tradisi Batik</span>
              </div>
              <div className="rounded-xl border border-[#D9C19B] bg-[#FFF9EE] p-4 shadow-xs">
                <span className="block text-2xl font-extrabold text-[#B5532A]">100% Asli</span>
                <span className="text-xs text-[#8A6B4A]">Karya Pengrajin Bantul</span>
              </div>
            </div>
          </motion.div>

          {/* Right Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-6">
            {pillars.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
              >
                <Card className="h-full border-[#D9C19B] bg-[#FFF9EE] p-5 shadow-xs hover:border-[#B5532A] transition-colors">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FAF3E5] border border-[#D9C19B] text-[#B5532A]">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-bold text-[#2B1A0E] text-base">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-xs text-[#8A6B4A] leading-relaxed">
                    {p.desc}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
