"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/ui-store";
import { Shirt } from "lucide-react";
import { CartDrawer } from "@/components/shop/cart-drawer";

export function LandingNavbar() {
  const openLogin = useUIStore((s) => s.openLogin);
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
            <Shirt className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-semibold tracking-tight">
              Batik Bu Mien
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Warisan Motif
            </span>
          </div>
        </a>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <a href="#kategori" className="hover:text-accent transition-colors">
            Kategori
          </a>
          <a href="#katalog" className="hover:text-accent transition-colors">
            Katalog
          </a>
          <a href="#cerita" className="hover:text-accent transition-colors">
            Cerita Kami
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <CartDrawer />
          <Button
            size="sm"
            onClick={openLogin}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Masuk Admin
          </Button>
        </div>
      </div>
    </header>
  );
}
