"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

type Cat = {
  name: string;
  desc: string;
  image: string;
  alt: string;
  slug: string;
};

const categories: Cat[] = [
  {
    name: "Kemeja Batik",
    desc: "Kemeja lengan panjang & pendek siap pakai untuk formal dan harian.",
    image: "/landing/kemeja.jpeg",
    alt: "Kemeja batik pria siap pakai",
    slug: "kemeja",
  },
  {
    name: "Daster Batik",
    desc: "Daster katun adem dengan motif klasik sidomukti dan parang.",
    image: "/landing/daster.jpeg",
    alt: "Daster batik wanita",
    slug: "daster",
  },
  {
    name: "Sarung Batik",
    desc: "Sarung tenun motif tradisional dengan sentuhan warna sogan khas.",
    image: "/landing/sarung.jpeg",
    alt: "Sarung batik motif tradisional",
    slug: "sarung",
  },
  {
    name: "Sorban Batik",
    desc: "Sorban batik anggun dengan aksen motif mega mendung dan kawung.",
    image: "/landing/sorban.jpeg",
    alt: "Sorban batik",
    slug: "sorban",
  },
  {
    name: "Blangkon",
    desc: "Blangkon gaya Yogyakarta dan Surakarta dengan lipatan rapi dan pakem.",
    image: "/landing/blangkon.jpeg",
    alt: "Blangkon tradisional",
    slug: "blangkon",
  },
  {
    name: "Selop Batik",
    desc: "Alas kaki selop adat berbalut kain batik untuk kelengkapan busana Jawa.",
    image: "/landing/selop.jpeg",
    alt: "Selop batik tradisional",
    slug: "selop",
  },
];

export function CategoriesSection() {
  function handleSelectCategory(catName: string) {
    const el = document.getElementById("katalog");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      window.dispatchEvent(
        new CustomEvent("batik-filter-category", { detail: catName })
      );
    }
  }

  return (
    <section
      id="kategori"
      className="border-b border-[#D9C19B] bg-[#FAF3E5] py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#B5532A]">
            Pilihan Koleksi
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#2B1A0E] sm:text-4xl">
            Kategori Busana & Perlengkapan Batik
          </h2>
          <p className="mt-3 text-base text-[#6A4E36]">
            Setiap produk dijahit dengan perhatian pada detail motif, potongan yang pas, dan kenyamanan bahan terbaik.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
            >
              <div
                onClick={() => handleSelectCategory(c.name)}
                className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#D9C19B] bg-[#FFF9EE] p-3 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[#B5532A] hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#E8D6B5]">
                  <img
                    src={c.image}
                    alt={c.alt}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2B1A0E]/50 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF9EE]/90 text-[#2B1A0E] shadow-sm transition-transform duration-300 group-hover:bg-[#B5532A] group-hover:text-white group-hover:rotate-45">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>

                <div className="flex flex-1 flex-col justify-between p-3.5">
                  <div>
                    <h3 className="text-lg font-bold text-[#2B1A0E] transition-colors group-hover:text-[#B5532A]">
                      {c.name}
                    </h3>
                    <p className="mt-1 text-xs text-[#8A6B4A] leading-relaxed line-clamp-2">
                      {c.desc}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-[#E8D6B5] pt-2 text-[11px] font-semibold text-[#6B3F1D]">
                    <span>Lihat Produk</span>
                    <span className="text-[#B5532A]">→</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
