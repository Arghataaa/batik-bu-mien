"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Package,
  TrendingUp,
  TrendingDown,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiGet } from "@/lib/api";
import { formatRupiah, formatNumber } from "@/lib/format";
import type { InsightReport } from "@/lib/types";

export function InsightsSection() {
  const q = useQuery({
    queryKey: ["insights"],
    queryFn: () => apiGet<InsightReport>("/api/insights"),
  });

  if (q.isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (q.error) {
    return (
      <Card className="border-destructive/40">
        <CardContent className="flex items-center gap-3 p-4 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Gagal memuat insights.
        </CardContent>
      </Card>
    );
  }

  const data = q.data;
  if (!data) return null;

  if (data.insufficientData) {
    return (
      <div className="space-y-4">
        <Card className="border-gold/40 bg-gradient-to-br from-card to-secondary/40">
          <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-start">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-gold/15 text-gold shrink-0">
              <Info className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Data Penjualan Belum Mencukupi</h3>
              <p className="text-sm text-muted-foreground">
                {data.message ||
                  "Sistem memerlukan minimal 14 hari transaksi dan total 5 penjualan dalam 60 hari terakhir untuk menghasilkan insights yang bermakna."}
              </p>
              <p className="text-sm text-muted-foreground">
                Insights di sini sepenuhnya berbasis data aktual penjualan Anda —
                tanpa prediksi sintetis. Silakan lanjutkan bertransaksi,
                insights akan otomatis muncul setelah data cukup.
              </p>
            </div>
          </CardContent>
        </Card>
        <p className="text-[11px] text-muted-foreground">
          Berdasarkan data aktual penjualan. Tanpa prediksi.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <InsightCard
          icon={Package}
          tone="accent"
          title="Produk Perlu Restock"
          desc="Stok menipis atau akan habis dalam 7 hari"
          count={data.restock.length}
        >
          <div className="max-h-72 overflow-y-auto scroll-soft">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-right">Stok</TableHead>
                  <TableHead className="text-right">Batas</TableHead>
                  <TableHead className="text-right">Vel. 30h</TableHead>
                  <TableHead>Rekomendasi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.restock.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                      Semua stok aman.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.restock.map((r) => (
                    <TableRow key={r.variantId || r.productId}>
                      <TableCell>
                        <p className="font-medium">{r.name}</p>
                        {r.variantLabel && (
                          <p className="text-[11px] text-muted-foreground">
                            {r.variantLabel}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <Badge variant={r.stock <= 0 ? "destructive" : "secondary"}>
                          {r.stock}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {r.lowStockThreshold}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(r.velocity30d)}/h
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground">
                        {r.recommendation}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </InsightCard>

        <InsightCard
          icon={TrendingUp}
          tone="primary"
          title="Produk Terlaris"
          desc="Top 5 produk 30 hari terakhir"
          count={data.topSellers.length}
        >
          <div className="max-h-72 overflow-y-auto scroll-soft">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Omzet</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topSellers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                      Belum ada penjualan 30 hari.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.topSellers.map((s, i) => (
                    <TableRow key={s.productId}>
                      <TableCell>
                        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] text-primary">
                          {i + 1}
                        </span>
                        <span className="font-medium">{s.name}</span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{s.qty}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatRupiah(s.revenue)}</TableCell>
                      <TableCell className="text-right tabular-nums text-green-700 dark:text-green-400">
                        {formatRupiah(s.profit)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </InsightCard>

        <InsightCard
          icon={TrendingDown}
          tone="gold"
          title="Penjualan Menurun"
          desc="Produk dengan penurunan signifikan"
          count={data.declining.length}
        >
          <div className="max-h-72 overflow-y-auto scroll-soft">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-right">Prev</TableHead>
                  <TableHead className="text-right">Last</TableHead>
                  <TableHead className="text-right">Δ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.declining.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                      Tidak ada penurunan signifikan.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.declining.map((d) => (
                    <TableRow key={d.productId}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {d.prevQty}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{d.lastQty}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive">
                          {formatNumber(d.changePct)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </InsightCard>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Berdasarkan data aktual penjualan. Tanpa prediksi.
      </p>
    </div>
  );
}

function InsightCard(props: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  count: number;
  tone: "primary" | "accent" | "gold";
  children: React.ReactNode;
}) {
  const Icon = props.icon;
  const toneClasses: Record<typeof props.tone, string> = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/15 text-accent",
    gold: "bg-gold/15 text-gold",
  };
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-md ${toneClasses[props.tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">{props.title}</CardTitle>
            <CardDescription>{props.desc}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {props.children}
      </CardContent>
    </Card>
  );
}
