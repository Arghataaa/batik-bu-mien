"use client";

import { MapPin, Phone, Instagram, Map, Clock, ShieldCheck } from "lucide-react";

export function LandingFooter() {
  return (
    <footer id="kontak" className="mt-auto border-t border-[#D9C19B] bg-[#FFF9EE]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
          {/* Brand info */}
          <div className="space-y-4 lg:col-span-5">
            <div className="flex items-center gap-3">
              <img
                src="/logo-circle.png"
                alt="Batik Bu Mien"
                className="h-10 w-10 rounded-full object-cover ring-2 ring-[#D9C19B]"
              />
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-bold text-[#2B1A0E]">Batik Bu Mien</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#8A6B4A]">
                  Warisan Motif · Modern Heritage
                </span>
              </div>
            </div>

            <p className="text-sm text-[#6A4E36] leading-relaxed max-w-sm">
              Toko produk batik siap pakai — kemeja batik pria, daster wanita, sarung tradisional, sorban, blangkon, dan selop batik dengan motif autentik nusantara.
            </p>

            <div className="flex items-center gap-4 pt-2 text-xs text-[#8A6B4A]">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <ShieldCheck className="h-4 w-4 text-[#B5532A]" /> Produk Asli UMKM
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Clock className="h-4 w-4 text-[#B5532A]" /> Buka Setiap Hari
              </span>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4 lg:col-span-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#2B1A0E]">
              Hubungi Kami
            </h3>
            <ul className="space-y-3 text-sm text-[#6A4E36]">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 text-[#B5532A] shrink-0" />
                <span className="text-xs leading-relaxed">
                  Jalan Menayu Kulon RT.06, RW.01, Menayu Lor, Tirtonirmolo, Kec. Kasihan, Kabupaten Bantul, D.I. Yogyakarta 55184
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-[#B5532A] shrink-0" />
                <a
                  href="https://wa.me/6285713468760"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold hover:text-[#B5532A] transition-colors"
                >
                  +62 857-1346-8760 (WhatsApp)
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Instagram className="h-4 w-4 text-[#B5532A] shrink-0" />
                <a
                  href="https://instagram.com/batikbumien"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold hover:text-[#B5532A] transition-colors"
                >
                  @batikbumien
                </a>
              </li>
            </ul>
          </div>

          {/* Location Map */}
          <div className="space-y-3 lg:col-span-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#2B1A0E]">
              Lokasi Butik
            </h3>
            <div className="overflow-hidden rounded-xl border border-[#D9C19B] shadow-sm bg-[#FAF3E5]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3952.684179374092!2d110.33627761100877!3d-7.823604592161794!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a5716c35dcabd%3A0x11100c366f1b89fa!2sBatik%20Bu%20Mien!5e0!3m2!1sid!2sid!4v1730638580000!5m2!1sid!2sid"
                width="100%"
                height="150"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Maps Lokasi Batik Bu Mien"
              />
            </div>
            <a
              href="https://maps.app.goo.gl/wbaEWMWzUfTUWHJj7"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#6B3F1D] hover:text-[#B5532A] transition-colors"
            >
              <Map className="h-3.5 w-3.5 text-[#B5532A]" />
              <span>Buka Petunjuk Arah di Google Maps</span>
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-[#D9C19B] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8A6B4A]">
          <p>© {new Date().getFullYear()} Batik Bu Mien. Seluruh hak cipta dilindungi.</p>
          <p>Warisan Motif Asli · Karya Budaya Nusantara</p>
        </div>
      </div>
    </footer>
  );
}
