"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  PackagePlus,
  PackageMinus,
  RefreshCw,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import {
  formatDateTime,
  isoDaysAgo,
  isoToday,
  variantLabel,
} from "@/lib/format";
import type {
  Product,
  StockMovement,
  Supplier,
  LowStockItem,
  StockMovementInput,
} from "@/lib/types";
import { useSession } from "next-auth/react";

export function InventorySection() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  return (
    <Tabs defaultValue="movements" className="space-y-4">
      <TabsList>
        <TabsTrigger value="movements">
          <RefreshCw className="h-4 w-4" />
          Pergerakan Stok
        </TabsTrigger>
        <TabsTrigger value="suppliers">
          <Truck className="h-4 w-4" />
          Pemasok
        </TabsTrigger>
        <TabsTrigger value="lowstock">
          <AlertTriangle className="h-4 w-4" />
          Stok Menipis
        </TabsTrigger>
      </TabsList>
      <TabsContent value="movements">
        <MovementsTab isAdmin={isAdmin} />
      </TabsContent>
      <TabsContent value="suppliers">
        <SuppliersTab isAdmin={isAdmin} />
      </TabsContent>
      <TabsContent value="lowstock">
        <LowStockTab />
      </TabsContent>
    </Tabs>
  );
}

// ----------------------------------------------------------------
// Movements tab
// ----------------------------------------------------------------

function MovementsTab({ isAdmin }: { isAdmin: boolean }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [from, setFrom] = useState(isoDaysAgo(29));
  const [to, setTo] = useState(isoToday());
  const [formOpen, setFormOpen] = useState(false);

  const qs = useMemo(() => {
    const params = new URLSearchParams();
    if (type !== "all") params.set("type", type);
    params.set("from", from);
    params.set("to", to);
    params.set("limit", "500");
    return params.toString();
  }, [type, from, to]);

  const movementsQ = useQuery({
    queryKey: ["stock", qs],
    queryFn: () => apiGet<StockMovement[]>(`/api/stock?${qs}`),
    placeholderData: (prev) => prev,
  });

  const filteredMovements = useMemo(() => {
    const list = movementsQ.data ?? [];
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter((m) => {
      const name = m.product?.name?.toLowerCase() || "";
      const sku = m.product?.sku?.toLowerCase() || "";
      return name.includes(q) || sku.includes(q);
    });
  }, [movementsQ.data, search]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-end md:p-4">
          <div className="space-y-1.5">
            <Label htmlFor="m-search">Cari Produk</Label>
            <Input
              id="m-search"
              placeholder="Nama produk…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tipe</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Semua" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="IN">Masuk (IN)</SelectItem>
                <SelectItem value="OUT">Keluar (OUT)</SelectItem>
                <SelectItem value="ADJUST">Penyesuaian</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-from">Dari</Label>
            <Input
              id="m-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              max={to}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-to">Sampai</Label>
            <Input
              id="m-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              min={from}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Riwayat Pergerakan Stok</CardTitle>
            <CardDescription>{filteredMovements.length} transaksi</CardDescription>
          </div>
          {isAdmin && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Tambah Pergerakan
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[28rem] overflow-y-auto scroll-soft">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Varian</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Alasan</TableHead>
                  <TableHead>Pemasok</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movementsQ.isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : movementsQ.error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-destructive">
                      Gagal memuat data.
                    </TableCell>
                  </TableRow>
                ) : (filteredMovements.length) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Belum ada pergerakan pada rentang ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMovements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(m.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {m.product?.name || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {m.variant ? variantLabel(m.variant) : "-"}
                      </TableCell>
                      <TableCell>
                        <MovementTypeBadge type={m.type} />
                      </TableCell>
                      <TableCell
                        className={`text-right tabular-nums font-medium ${
                          m.quantity >= 0 ? "text-green-700 dark:text-green-400" : "text-accent"
                        }`}
                      >
                        {m.quantity > 0 ? "+" : ""}
                        {m.quantity}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {m.reason || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {m.supplier?.name || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <MovementFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}

function MovementTypeBadge({ type }: { type: string }) {
  if (type === "IN")
    return (
      <Badge className="bg-green-700/90 text-white">
        <PackagePlus className="h-3 w-3" /> IN
      </Badge>
    );
  if (type === "OUT")
    return (
      <Badge className="bg-accent text-accent-foreground">
        <PackageMinus className="h-3 w-3" /> OUT
      </Badge>
    );
  return (
    <Badge variant="secondary">
      <RefreshCw className="h-3 w-3" /> ADJUST
    </Badge>
  );
}

function MovementFormDialog(props: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { open, onOpenChange } = props;
  const qc = useQueryClient();
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [type, setType] = useState<"IN" | "OUT" | "ADJUST">("IN");
  const [quantity, setQuantity] = useState("");
  const [newStock, setNewStock] = useState("");
  const [reason, setReason] = useState("");
  const [supplierId, setSupplierId] = useState("none");
  const [saving, setSaving] = useState(false);

  function reset() {
    setProductId("");
    setVariantId("");
    setType("IN");
    setQuantity("");
    setNewStock("");
    setReason("");
    setSupplierId("none");
  }

  const productsQ = useQuery({
    queryKey: ["products", "all-for-stock"],
    queryFn: () => apiGet<Product[]>(`/api/products?active=true`),
    enabled: open,
  });
  const suppliersQ = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => apiGet<Supplier[]>("/api/suppliers"),
    enabled: open,
  });

  const selectedProduct = productsQ.data?.find((p) => p.id === productId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) return toast.error("Pilih produk terlebih dahulu.");
    if (!variantId) return toast.error("Pilih varian.");
    if (type === "ADJUST" && (newStock === "" || !Number.isFinite(parseInt(newStock, 10))))
      return toast.error("Masukkan stok baru.");
    if ((type === "IN" || type === "OUT") && (!quantity || parseInt(quantity, 10) <= 0))
      return toast.error("Jumlah harus > 0.");

    setSaving(true);
    try {
      const payload: StockMovementInput = {
        productId,
        variantId,
        type,
        quantity:
          type === "IN" || type === "OUT" ? parseInt(quantity, 10) : undefined,
        newStock: type === "ADJUST" ? parseInt(newStock, 10) : undefined,
        reason: reason.trim() || null,
        supplierId: supplierId !== "none" ? supplierId : null,
      };
      await apiPost("/api/stock", payload);
      toast.success("Pergerakan stok ditambahkan.");
      qc.invalidateQueries({ queryKey: ["stock"] });
      qc.invalidateQueries({ queryKey: ["reports/low-stock"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah Pergerakan Stok</DialogTitle>
          <DialogDescription>
            Catat masuk, keluar, atau penyesuaian stok varian.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Produk</Label>
            <Select
              value={productId}
              onValueChange={(v) => {
                setProductId(v);
                setVariantId("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih produk" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {productsQ.data?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Varian</Label>
            <Select
              value={variantId}
              onValueChange={setVariantId}
              disabled={!selectedProduct}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih varian" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {selectedProduct?.variants.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {variantLabel(v) || v.sku} · stok {v.stock}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipe</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as typeof type)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">Masuk (IN)</SelectItem>
                  <SelectItem value="OUT">Keluar (OUT)</SelectItem>
                  <SelectItem value="ADJUST">Penyesuaian</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {type === "ADJUST" ? (
              <div className="space-y-1.5">
                <Label htmlFor="m-new">Stok Baru</Label>
                <Input
                  id="m-new"
                  type="number"
                  min={0}
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  placeholder="0"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="m-qty">Jumlah</Label>
                <Input
                  id="m-qty"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="1"
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="m-reason">Alasan (opsional)</Label>
            <Input
              id="m-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Restock dari pemasok / rusak / display"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Pemasok (opsional)</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tanpa pemasok" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanpa pemasok</SelectItem>
                {suppliersQ.data?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan…
                </>
              ) : (
                "Simpan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------
// Suppliers tab
// ----------------------------------------------------------------

function SuppliersTab({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const suppliersQ = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => apiGet<Supplier[]>("/api/suppliers"),
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);

  const deleteM = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/suppliers/${id}`),
    onSuccess: () => {
      toast.success("Pemasok dihapus.");
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div>
            <p className="font-medium">Daftar Pemasok</p>
            <p className="text-xs text-muted-foreground">
              {suppliersQ.data?.length || 0} pemasok
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Tambah Pemasok
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="max-h-[28rem] overflow-y-auto scroll-soft">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Alamat</TableHead>
                  {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliersQ.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 5 : 4}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ) : (suppliersQ.data?.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 5 : 4} className="text-center text-muted-foreground py-8">
                      Belum ada pemasok.
                    </TableCell>
                  </TableRow>
                ) : (
                  suppliersQ.data?.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-muted-foreground">{s.contact || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{s.phone || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{s.address || "-"}</TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditing(s);
                                setFormOpen(true);
                              }}
                              aria-label="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteTarget(s)}
                              aria-label="Hapus"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <SupplierFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        editing={editing}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pemasok?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? `Pemasok "${deleteTarget.name}" akan dihapus.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) deleteM.mutate(deleteTarget.id);
                setDeleteTarget(null);
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SupplierFormDialog(props: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Supplier | null;
}) {
  const { open, onOpenChange, editing } = props;
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    contact: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        name: editing?.name || "",
        contact: editing?.contact || "",
        phone: editing?.phone || "",
        address: editing?.address || "",
        notes: editing?.notes || "",
      });
    }
  }, [open, editing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Nama wajib diisi.");
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        contact: form.contact.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
      };
      if (editing) {
        await apiPatch(`/api/suppliers/${editing.id}`, payload);
        toast.success("Pemasok diperbarui.");
      } else {
        await apiPost("/api/suppliers", payload);
        toast.success("Pemasok ditambahkan.");
      }
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Pemasok" : "Tambah Pemasok"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="s-name">Nama</Label>
            <Input
              id="s-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-contact">Kontak (opsional)</Label>
            <Input
              id="s-contact"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              placeholder="Bu Surip"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-phone">Telepon (opsional)</Label>
            <Input
              id="s-phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="0812-xxxx-xxxx"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-address">Alamat (opsional)</Label>
            <Textarea
              id="s-address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-notes">Catatan (opsional)</Label>
            <Textarea
              id="s-notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan…" : editing ? "Simpan" : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------
// Low stock tab
// ----------------------------------------------------------------

function LowStockTab() {
  const lowStockQ = useQuery({
    queryKey: ["reports/low-stock"],
    queryFn: () => apiGet<LowStockItem[]>("/api/reports/low-stock"),
    refetchInterval: 60_000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stok Menipis</CardTitle>
        <CardDescription>
          Varian dengan stok di bawah atau sama dengan batas minimum
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[28rem] overflow-y-auto scroll-soft">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Varian</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Stok</TableHead>
                <TableHead className="text-right">Batas</TableHead>
                <TableHead className="text-right">Selisih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockQ.isLoading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ) : (lowStockQ.data?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Semua stok aman. Mantap!
                  </TableCell>
                </TableRow>
              ) : (
                lowStockQ.data?.map((it) => {
                  const diff = it.stock - it.lowStockThreshold;
                  return (
                    <TableRow key={it.variantId || it.productId}>
                      <TableCell className="font-medium">{it.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {it.variantLabel || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{it.sku}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {it.stock}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {it.lowStockThreshold}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive">{diff}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
