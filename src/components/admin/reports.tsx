"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Bar,
  BarChart,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import {
  RefreshCw,
  AlertTriangle,
  Wallet,
  TrendingUp,
  Receipt,
  Calculator,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiGet } from "@/lib/api";
import {
  formatRupiah,
  formatNumber,
  formatDateTime,
  formatTrendLabel,
  isoDaysAgo,
  isoToday,
} from "@/lib/format";
import type {
  Category,
  SummaryReport,
  TopProduct,
  TopCategory,
  SalesTrendPoint,
  StockFlow,
  Sale,
} from "@/lib/types";

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function ReportsSection() {
  const [from, setFrom] = useState(isoDaysAgo(29));
  const [to, setTo] = useState(isoToday());
  const [categoryId, setCategoryId] = useState("all");

  const qs = useMemo(() => {
    const params = new URLSearchParams({ from, to });
    if (categoryId !== "all") params.set("categoryId", categoryId);
    return params.toString();
  }, [from, to, categoryId]);

  const categoriesQ = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<Category[]>("/api/categories"),
  });
  const summaryQ = useQuery({
    queryKey: ["reports/summary", qs],
    queryFn: () => apiGet<SummaryReport>(`/api/reports/summary?${qs}`),
  });
  const trendQ = useQuery({
    queryKey: ["reports/sales-trend", qs],
    queryFn: () =>
      apiGet<SalesTrendPoint[]>(
        `/api/reports/sales-trend?${qs}&granularity=day`
      ),
  });
  const topProductsQ = useQuery({
    queryKey: ["reports/top-products", qs],
    queryFn: () =>
      apiGet<TopProduct[]>(`/api/reports/top-products?${qs}&limit=20`),
  });
  const topCategoriesQ = useQuery({
    queryKey: ["reports/top-categories", from, to],
    queryFn: () =>
      apiGet<TopCategory[]>(`/api/reports/top-categories?from=${from}&to=${to}`),
  });
  const stockFlowQ = useQuery({
    queryKey: ["reports/stock-flow", from, to],
    queryFn: () =>
      apiGet<StockFlow>(`/api/reports/stock-flow?from=${from}&to=${to}`),
  });
  const salesQ = useQuery({
    queryKey: ["sales", from, to],
    queryFn: () =>
      apiGet<Sale[]>(`/api/sales?from=${from}&to=${to}&limit=50`),
  });

  function resetRange() {
    setFrom(isoDaysAgo(29));
    setTo(isoToday());
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="grid gap-3 md:grid-cols-[repeat(2,minmax(0,1fr))_minmax(0,1fr)_auto] md:items-end md:p-4">
          <div className="space-y-1.5">
            <Label htmlFor="r-from">Dari</Label>
            <Input
              id="r-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              max={to}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="r-to">Sampai</Label>
            <Input
              id="r-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              min={from}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Kategori</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categoriesQ.data?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={resetRange} className="w-full">
              <RefreshCw className="h-4 w-4" />
              30 Hari
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Wallet} label="Omzet" value={summaryQ.data ? formatRupiah(summaryQ.data.omzet) : undefined} loading={summaryQ.isLoading} tone="primary" />
        <KpiCard icon={TrendingUp} label="Keuntungan" value={summaryQ.data ? formatRupiah(summaryQ.data.profit) : undefined} loading={summaryQ.isLoading} tone="accent" />
        <KpiCard icon={Receipt} label="Transaksi" value={summaryQ.data ? formatNumber(summaryQ.data.txCount) : undefined} loading={summaryQ.isLoading} tone="gold" />
        <KpiCard icon={Calculator} label="Rata-rata / Tx" value={summaryQ.data ? formatRupiah(summaryQ.data.avgPerTx) : undefined} loading={summaryQ.isLoading} tone="muted" />
      </div>

      {/* Sales trend */}
      <Card>
        <CardHeader>
          <CardTitle>Tren Penjualan</CardTitle>
          <CardDescription>Omzet dan profit per hari</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {trendQ.isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : trendQ.error ? (
            <ErrorState />
          ) : (trendQ.data?.length ?? 0) === 0 ? (
            <EmptyState message="Belum ada transaksi pada rentang ini." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendQ.data ?? []} margin={{ left: -8, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="r-rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="r-prof" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="label" tickFormatter={formatTrendLabel} stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}rb`} />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--popover-foreground)", fontSize: 12 }}
                  labelFormatter={(l) => formatTrendLabel(String(l))}
                  formatter={(v: number) => formatRupiah(v)}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => v === "revenue" ? "Omzet" : "Profit"} />
                <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2} fill="url(#r-rev)" name="revenue" />
                <Area type="monotone" dataKey="profit" stroke="var(--chart-2)" strokeWidth={2} fill="url(#r-prof)" name="profit" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Produk Terlaris</CardTitle>
            <CardDescription>Top produk berdasarkan qty</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto scroll-soft">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Omzet</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProductsQ.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ) : (topProductsQ.data?.length ?? 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        Belum ada data.
                      </TableCell>
                    </TableRow>
                  ) : (
                    topProductsQ.data?.map((p, i) => (
                      <TableRow key={p.productId}>
                        <TableCell className="font-medium">
                          <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[11px] text-muted-foreground">
                            {i + 1}
                          </span>
                          {p.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{p.sku}</TableCell>
                        <TableCell className="text-right tabular-nums">{p.qty}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatRupiah(p.revenue)}</TableCell>
                        <TableCell className="text-right tabular-nums text-green-700 dark:text-green-400">
                          {formatRupiah(p.profit)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kategori Terlaris</CardTitle>
            <CardDescription>Top kategori berdasarkan qty & omzet</CardDescription>
          </CardHeader>
          <CardContent>
            {topCategoriesQ.isLoading ? (
              <Skeleton className="h-60 w-full" />
            ) : (topCategoriesQ.data?.length ?? 0) === 0 ? (
              <EmptyState message="Belum ada data." />
            ) : (
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCategoriesQ.data ?? []} layout="vertical" margin={{ left: 16, right: 16, top: 8, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" horizontal={false} />
                    <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={110} tickFormatter={(v: string) => v.length > 14 ? v.slice(0, 14) + "…" : v} />
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--popover-foreground)", fontSize: 12 }} formatter={(v: number, n: string) => n === "qty" ? [`${v} unit`, "Qty"] : [formatRupiah(v), n === "revenue" ? "Omzet" : "Profit"]} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="revenue" radius={[0, 4, 4, 0]} name="Omzet">
                      {(topCategoriesQ.data ?? []).map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stock flow */}
      <Card>
        <CardHeader>
          <CardTitle>Arus Stok</CardTitle>
          <CardDescription>Pergerakan unit dan nilai (modal) pada rentang tanggal</CardDescription>
        </CardHeader>
        <CardContent>
          {stockFlowQ.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : stockFlowQ.data ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <FlowTile label="Stok Masuk" units={stockFlowQ.data.inUnits} value={stockFlowQ.data.inValue} color="text-green-700 dark:text-green-400" />
              <FlowTile label="Stok Keluar" units={stockFlowQ.data.outUnits} value={stockFlowQ.data.outValue} color="text-accent" />
              <FlowTile label="Penyesuaian" units={stockFlowQ.data.adjustUnits} value={0} color="text-muted-foreground" />
            </div>
          ) : (
            <EmptyState message="Belum ada data." />
          )}
        </CardContent>
      </Card>

      {/* Recent transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transaksi Terbaru</CardTitle>
          <CardDescription>50 transaksi terakhir pada rentang</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto scroll-soft">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesQ.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ) : (salesQ.data?.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                      Belum ada transaksi.
                    </TableCell>
                  </TableRow>
                ) : (
                  salesQ.data?.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(s.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">{s.invoiceNo}</TableCell>
                      <TableCell>{s.items.length} item</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{s.paymentMethod}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatRupiah(s.total)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-green-700 dark:text-green-400">
                        {formatRupiah(s.totalProfit)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard(props: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string;
  loading?: boolean;
  tone: "primary" | "accent" | "gold" | "muted";
}) {
  const Icon = props.icon;
  const toneClasses: Record<typeof props.tone, string> = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/15 text-accent",
    gold: "bg-gold/15 text-gold",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-md ${toneClasses[props.tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {props.label}
          </p>
          {props.loading ? (
            <Skeleton className="mt-1 h-6 w-28" />
          ) : (
            <p className="truncate text-xl font-bold">{props.value ?? "-"}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FlowTile(props: { label: string; units: number; value: number; color: string }) {
  return (
    <div className="rounded-md border border-border/70 bg-card/40 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {props.label}
      </p>
      <p className="mt-1 text-lg font-bold">{formatNumber(props.units)} unit</p>
      {props.value > 0 && (
        <p className="text-[11px] text-muted-foreground">
          Nilai: {formatRupiah(props.value)}
        </p>
      )}
      <p className={`mt-1 text-[11px] ${props.color}`}>·</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center p-6 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex h-full items-center justify-center p-6 text-center">
      <p className="flex items-center gap-1.5 text-sm text-destructive">
        <AlertTriangle className="h-4 w-4" />
        Gagal memuat data.
      </p>
    </div>
  );
}
