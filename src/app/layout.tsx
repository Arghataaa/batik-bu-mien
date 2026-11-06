import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Batik Bu Mien — Toko Batik Siap Pakai",
  description:
    "Batik Bu Mien: toko produk batik siap pakai — kemeja batik, daster, sarung, sorban, blangkon, dan fashion batik lainnya. Warisan motif modern.",
  keywords: ["Batik Bu Mien", "batik siap pakai", "kemeja batik", "daster batik", "sarung batik", "sorban", "blangkon"],
  authors: [{ name: "Batik Bu Mien" }],
  icons: {
    icon: "/logo-circle.png",
    apple: "/logo-circle.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <Providers>
          {children}
          <Toaster />
          <SonnerToaster richColors position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
