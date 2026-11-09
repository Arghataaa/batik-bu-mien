"use client";

import { useSession, signIn } from "next-auth/react";
import { useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminPage() {
  const { status, data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF3E5]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-[#6B3F1D] border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-[#6B3F1D]">Memuat admin...</p>
        </div>
      </div>
    );
  }

  if (status === "authenticated" && session) {
    return <AdminShell />;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email dan password wajib diisi.");
      return;
    }
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (!res || res.error) {
        toast.error("Email atau password salah.");
        return;
      }
      toast.success("Login berhasil.");
    } catch {
      toast.error("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF3E5] p-4">
      <Card className="w-full max-w-md border-[#D9C19B] bg-[#FFFDF7] shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#6B3F1D] text-[#FAF3E5]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#2B1A0E]">Admin Batik Bu Mien</CardTitle>
          <CardDescription className="text-[#8A6B4A]">
            Masuk untuk mengelola produk, stok, dan pesanan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email" className="text-xs font-semibold text-[#2B1A0E]">Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@batikbumien.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="border-[#D9C19B] bg-white focus-visible:ring-[#6B3F1D]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-password" className="text-xs font-semibold text-[#2B1A0E]">Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="border-[#D9C19B] bg-white focus-visible:ring-[#6B3F1D]"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#6B3F1D] text-[#FAF3E5] hover:bg-[#522E13] font-semibold gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{loading ? "Memverifikasi..." : "Masuk ke Dashboard"}</span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
