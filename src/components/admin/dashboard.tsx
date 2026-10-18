"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  Receipt,
  Calculator,
  AlertTriangle,
  PackagePlus,
  PackageMinus,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiGet } from "@/lib/api";
import {
  formatRupiah,
  formatNumber,
  isoDaysAgo,
  isoToday,
  formatTrendLabel,
} from "@/lib/format";
import type {
  Category,
  SummaryReport,
  TopProduct,
  TopCategory,
  SalesTrendPoint,
  LowStockItem,
  StockFlow,
} from "@/lib/types";

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function DashboardSection() {
  const [from, setFrom] = useState(isoDaysAgo(29));
  const [to, setTo] = useState(isoToday());
  const [categoryId, setCategoryId] = useState<string>("all");

  const queryParams = useMemo(() => {
    const params = new URLSearchParams({ from, to });
    if (categoryId && categoryId !== "all") params.set("categoryId", categoryId);
    return params.toString();
  }, [from, to, categoryId]);

  const categoriesQ = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<Category[]>("/api/categories"),
  });

  const summaryQ = useQuery({
    queryKey: ["reports/summary", queryParams],
    queryFn: () =>
      apiGet<SummaryReport>(`/api/reports/summary?${queryParams}`),
    enabled: !!from && !!to,
  });

  const trendQ = useQuery({
    queryKey: ["reports/sales-trend", queryParams],
    queryFn: () =>
      apiGet<SalesTrendPoint[]>(
        `/api/reports/sales-trend?${queryParams}&granularity=day`
      ),
    enabled: !!from && !!to,
  });

  const topProductsQ = useQuery({
    queryKey: ["reports/top-products", queryParams],
    queryFn: () =>
      apiGet<TopProduct[]>(`/api/reports/top-products?${queryParams}&limit=5`),
    enabled: !!from && !!to,
  });

  const topCategoriesQ = useQuery({
    queryKey: ["reports/top-categories", from, to],
    queryFn: () =>
      apiGet<TopCategory[]>(
        `/api/reports/top-categories?from=${from}&to=${to}`
      ),
    enabled: !!from && !!to,
  });

  const lowStockQ = useQuery({
    queryKey: ["reports/low-stock"],
    queryFn: () => apiGet<LowStockItem[]>("/api/reports/low-stock"),
    refetchInterval: 60_000,
  });

  const stockFlowQ = useQuery({
    queryKey: ["reports/stock-flow", from, to],
    queryFn: () =>
      apiGet<StockFlow>(`/api/reports/stock-flow?from=${from}&to=${to}`),
    enabled: !!from && !!to,
  });

  function resetRange() {
    setFrom(isoDaysAgo(29));
    setTo(isoToday());
  }

  const summary = summaryQ.data;
  const hasSummary = !!summary;

  return (
    <div className="space-y-6">
      <Filters
        from={from}
        to={to}
        setFrom={setFrom}
        setTo={setTo}
        categoryId={categoryId}
        setCategoryId={setCategoryId}
        categories={categoriesQ.data ?? []}
        categoriesLoading={categoriesQ.isLoading}
        onReset={resetRange}
      />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Wallet}
          label="Omzet"
          value={summary ? formatRupiah(summary.omzet) : undefined}
          loading={summaryQ.isLoading}
          tone="primary"
        />
        <KpiCard
          icon={TrendingUp}
          label="Keuntungan"
          value={summary ? formatRupiah(summary.profit) : undefined}
          loading={summaryQ.isLoading}
          tone="accent"
        />
        <KpiCard
          icon={Receipt}
          label="Jumlah Transaksi"
          value={summary ? formatNumber(summary.txCount) : undefined}
          loading={summaryQ.isLoading}
          tone="gold"
        />
        <KpiCard
          icon={Calculator}
          label="Transaksi Rata-rata"
          value={summary ? formatRupiah(summary.avgPerTx) : undefined}
          loading={summaryQ.isLoading}
          tone="muted"
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tren Penjualan</CardTitle>
            <CardDescription>Omzet dan keuntungan per hari</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {trendQ.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : trendQ.error ? (
              <ErrorState />
            ) : (trendQ.data?.length ?? 0) === 0 ? (
              <EmptyState message="Belum ada transaksi pada rentang ini." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendQ.data ?? []}
                  margin={{ left: -8, right: 8, top: 8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="profFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickFormatter={formatTrendLabel}
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${Math.round(v / 1000)}rb`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      color: "var(--popover-foreground)",
                      fontSize: 12,
                    }}
                    labelFormatter={(l) => formatTrendLabel(String(l))}
                    formatter={(v: number) => formatRupiah(v)}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    formatter={(v) =>
                      v === "revenue" ? "Omzet" : v === "profit" ? "Profit" : v
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    fill="url(#revFill)"
                    name="Omzet"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    fill="url(#profFill)"
                    name="Profit"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produk Terlaris</CardTitle>
            <CardDescription>Top 5 berdasarkan qty</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {topProductsQ.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : topProductsQ.error ? (
              <ErrorState />
            ) : (topProductsQ.data?.length ?? 0) === 0 ? (
              <EmptyState message="Belum ada produk terjual pada rentang ini." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProductsQ.data ?? []}
                  layout="vertical"
                  margin={{ left: 16, right: 16, top: 8, bottom: 0 }}
                >
                  <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={120}
                    tickFormatter={(v: string) =>
                      v.length > 18 ? v.slice(0, 18) + "…" : v
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      color: "var(--popover-foreground)",
                      fontSize: 12,
                    }}
                    formatter={(v: number, n: string) =>
                      n === "qty" ? [`${v} unit`, "Qty"] : [formatRupiah(v), n === "revenue" ? "Omzet" : "Profit"]
                    }
                  />
                  <Bar dataKey="qty" radius={[0, 4, 4, 0]}>
                    {(topProductsQ.data ?? []).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Categories + Low stock + Stock flow */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Kategori Terlaris</CardTitle>
            <CardDescription>Distribusi pendapatan per kategori</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {topCategoriesQ.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : topCategoriesQ.error ? (
              <ErrorState />
            ) : (topCategoriesQ.data?.length ?? 0) === 0 ? (
              <EmptyState message="Belum ada data kategori." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topCategoriesQ.data ?? []}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {(topCategoriesQ.data ?? []).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      color: "var(--popover-foreground)",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => formatRupiah(v)}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stok Menipis</CardTitle>
            <CardDescription>Perlu segera direstock</CardDescription>
          </CardHeader>
          <CardContent className="max-h-72 overflow-y-auto scroll-soft">
            {lowStockQ.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : lowStockQ.error ? (
              <ErrorState />
            ) : (lowStockQ.data?.length ?? 0) === 0 ? (
              <EmptyState message="Semua stok aman. Mantap!" />
            ) : (
              <ul className="space-y-2">
                {(lowStockQ.data ?? []).map((item) => (
                  <li
                    key={item.variantId || item.productId}
                    className="flex items-center justify-between gap-2 rounded-md border border-border/70 bg-card/40 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {item.name}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {item.variantLabel || item.sku}
                      </p>
                    </div>
                    <Badge variant="destructive" className="shrink-0">
                      {item.stock} / {item.lowStockThreshold}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Arus Stok</CardTitle>
            <CardDescription>Pergerakan unit & nilai (modal)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stockFlowQ.isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : stockFlowQ.error ? (
              <ErrorState />
            ) : !stockFlowQ.data ? null : (
              <>
                <FlowRow
                  icon={PackagePlus}
                  label="Stok Masuk"
                  units={stockFlowQ.data.inUnits}
                  value={stockFlowQ.data.inValue}
                  color="text-green-700 dark:text-green-400"
                />
                <FlowRow
                  icon={PackageMinus}
                  label="Stok Keluar"
                  units={stockFlowQ.data.outUnits}
                  value={stockFlowQ.data.outValue}
                  color="text-accent"
                />
                <FlowRow
                  icon={RefreshCw}
                  label="Penyesuaian"
                  units={stockFlowQ.data.adjustUnits}
                  value={0}
                  color="text-muted-foreground"
                />
                {hasSummary && (
                  <div className="mt-2 border-t border-border pt-3 text-xs text-muted-foreground">
                    HPP terjual (COGS): {formatRupiah(summary?.cogsSold ?? 0)}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Filters(props: {
  from: string;
  to: string;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
  categoryId: string;
  setCategoryId: (v: string) => void;
  categories: Category[];
  categoriesLoading: boolean;
  onReset: () => void;
}) {
  return (
    <Card>
      <CardContent className="grid gap-3 md:grid-cols-[repeat(2,minmax(0,1fr))_minmax(0,1fr)_auto] md:items-end md:p-4">
        <div className="space-y-1.5">
          <Label htmlFor="from">Dari Tanggal</Label>
          <Input
            id="from"
            type="date"
            value={props.from}
            onChange={(e) => props.setFrom(e.target.value)}
            max={props.to}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="to">Sampai Tanggal</Label>
          <Input
            id="to"
            type="date"
            value={props.to}
            onChange={(e) => props.setTo(e.target.value)}
            min={props.from}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Kategori</Label>
          <Select
            value={props.categoryId}
            onValueChange={props.setCategoryId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Semua kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {props.categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button variant="outline" onClick={props.onReset} className="w-full">
            <RefreshCw className="h-4 w-4" />
            30 Hari Terakhir
          </Button>
        </div>
      </CardContent>
    </Card>
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

function FlowRow(props: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  units: number;
  value: number;
  color: string;
}) {
  const Icon = props.icon;
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border/70 bg-card/40 px-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className={`h-4 w-4 ${props.color}`} />
        <span className="text-sm">{props.label}</span>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold">{formatNumber(props.units)} unit</p>
        {props.value > 0 && (
          <p className="text-[11px] text-muted-foreground">
            {formatRupiah(props.value)}
          </p>
        )}
      </div>
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
