"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { CartDrawer } from "@/components/shop/cart-drawer";

const links = [
  { label: "Beranda", href: "/#top" },
  { label: "Katalog", href: "/#katalog" },
  { label: "Lacak Pesanan", href: "/cek-pesanan" },
  { label: "Cerita Kami", href: "/#cerita" },
  { label: "Kontak", href: "/#kontak" },
];

export function LandingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    /* Wrapper — sticky strip, transparent until scrolled */
    <header
      className={`sticky top-0 z-40 w-full transition-colors duration-300 ${
        scrolled ? "bg-[#FAF3E5]/80 backdrop-blur" : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-5 py-3">
        {/* Pill container */}
        <div
          className={`relative flex h-[60px] items-center justify-between rounded-2xl border border-[#D9C19B] bg-[#FFFDF7] px-4 sm:px-5 transition-shadow duration-300 ${
            scrolled ? "shadow-[0_4px_24px_rgba(107,63,29,0.10)]" : "shadow-[0_2px_12px_rgba(107,63,29,0.07)]"
          }`}
        >
          {/* LEFT — Logo */}
          <Link
            href="/"
            aria-label="Batik Bu Mien, Beranda"
            className="flex shrink-0 items-center gap-2.5 group z-10"
          >
            <div className="relative h-9 w-9 overflow-hidden rounded-full ring-2 ring-[#D9C19B]/80 ring-offset-1 ring-offset-[#FFFDF7] transition-transform duration-300 group-hover:scale-105">
              <img
                src="/logo-circle.png"
                alt="Logo Batik Bu Mien"
                className="h-full w-full object-cover"
              />
            </div>
            <span className="hidden sm:flex flex-col leading-tight">
              <span className="text-[14px] font-bold tracking-tight text-[#2B1A0E]">
                Batik Bu Mien
              </span>
              <span className="text-[9px] uppercase tracking-[0.18em] text-[#8A6B4A]">
                Warisan Motif · Modern Heritage
              </span>
            </span>
          </Link>

          {/* CENTER — Desktop nav (absolutely centered) */}
          <nav
            aria-label="Navigasi utama"
            className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 lg:flex"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-4 py-2 text-[13px] font-semibold text-[#4A2E14] transition-all duration-200 hover:bg-[#F0E4D0] hover:text-[#6B3F1D]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* RIGHT — Cart + mobile hamburger */}
          <div className="flex items-center gap-2 z-10">
            <CartDrawer />

            {/* Mobile hamburger */}
            <div className="lg:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Buka menu navigasi"
                    className="h-9 w-9 rounded-xl text-[#6B3F1D] hover:bg-[#F0E4D0]"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>

                <SheetContent
                  side="right"
                  className="w-[min(88vw,320px)] border-l border-[#D9C19B] bg-[#FFFDF7] p-0"
                >
                  <SheetHeader className="border-b border-[#E8D6B5] px-5 py-4">
                    <SheetTitle className="flex items-center gap-2.5 text-left text-[#2B1A0E]">
                      <img
                        src="/logo-circle.png"
                        alt=""
                        className="h-8 w-8 rounded-full object-cover ring-1 ring-[#D9C19B]"
                      />
                      <div className="flex flex-col leading-tight">
                        <span className="text-sm font-bold text-[#2B1A0E]">Batik Bu Mien</span>
                        <span className="text-[9px] uppercase tracking-widest text-[#8A6B4A]">Warisan Motif</span>
                      </div>
                    </SheetTitle>
                  </SheetHeader>

                  <nav
                    aria-label="Navigasi mobile"
                    className="flex flex-col px-3 py-4 gap-0.5"
                  >
                    {links.map((link) => (
                      <SheetClose asChild key={link.href}>
                        <Link
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className="rounded-xl px-4 py-3 text-[15px] font-semibold text-[#4A2E14] transition-colors hover:bg-[#F0E4D0] hover:text-[#6B3F1D] active:bg-[#DEC9A5]"
                        >
                          {link.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>

                  <div className="mx-4 mt-2 rounded-xl border border-[#D9C19B] bg-[#FAF3E5] px-4 py-3">
                    <p className="text-[10px] uppercase tracking-widest text-[#8A6B4A]">WhatsApp</p>
                    <a
                      href="https://wa.me/6285713468760"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 block text-sm font-semibold text-[#6B3F1D] hover:underline"
                    >
                      +62 857-1346-8760
                    </a>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
