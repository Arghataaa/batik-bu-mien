"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingFooter } from "@/components/landing/landing-footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, PackageCheck } from "lucide-react";

export default function CekPesananPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = orderNumber.trim();
    if (!query) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/store/orders/track?orderNumber=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Nomor pesanan tidak ditemukan. Pastikan nomor pesanan benar (contoh: BBM-1794196911191).");
        setLoading(false);
        return;
      }

      router.push(`/pesanan/${data.trackingToken}`);
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi beberapa saat.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf6ee]">
      <LandingNavbar />
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <Card className="w-full max-w-lg border-[#e6d4bd] bg-white shadow-md">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-[#f4e7d6] flex items-center justify-center text-[#744628] mb-1">
              <PackageCheck className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-bold text-[#392719]">Cek Status Pesanan</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Lacak progres pesanan, pengiriman, dan status pembayaran Anda tanpa perlu login.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#392719]">
                  Nomor Pesanan
                </label>
                <div className="relative">
                  <Input
                    placeholder="Contoh: BBM-1794196911191"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="h-11 border-[#e6d4bd] bg-[#fbf6ee]/40 pr-10 focus-visible:border-[#8b542e] focus-visible:ring-[#8b542e]/20"
                    required
                  />
                  <Search className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Nomor pesanan didapatkan saat selesai checkout atau dikirimkan melalui WhatsApp.
                </p>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !orderNumber.trim()}
                className="w-full h-11 bg-[#744628] hover:bg-[#5c361f] text-white font-semibold rounded-lg"
              >
                {loading ? "Mencari Pesanan..." : "Lacak Pesanan"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <LandingFooter />
    </div>
  );
}
