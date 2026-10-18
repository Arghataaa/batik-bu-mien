"use client";

import { Shirt, MapPin, Phone, Mail } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Shirt className="h-5 w-5" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-base font-semibold">Batik Bu Mien</span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Warisan Motif · Modern Heritage
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Toko produk batik siap pakai — kemeja, daster, sarung, sorban,
              dan blangkon — dengan motif autentik dan jahitan modern.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Kontak</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-accent shrink-0" />
                <span>Jl. Kawung No. 12, Yogyakarta, Indonesia</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 text-accent shrink-0" />
                <span>+62 274 123 456</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 text-accent shrink-0" />
                <span>halo@batikbumien.id</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Layanan</h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li>Katalog siap pakai</li>
              <li>Kustomisasi motif</li>
              <li>Wholesale & reseller</li>
              <li>Pelatihan membatik</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Batik Bu Mien. Seluruh hak cipta
          dilindungi.
        </div>
      </div>
    </footer>
  );
}
