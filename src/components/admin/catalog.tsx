"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Shirt,
  Loader2,
  AlertTriangle,
  Package,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { apiGet, apiPost, apiPatch, apiDelete, apiUploadImage } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import type {
  Category,
  Product,
  ProductVariantInput,
  ProductInput,
} from "@/lib/types";
import { useSession } from "next-auth/react";

export function CatalogSection() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  return (
    <Tabs defaultValue="products" className="space-y-4">
      <TabsList>
        <TabsTrigger value="products">
          <Package className="h-4 w-4" />
          Produk
        </TabsTrigger>
        <TabsTrigger value="categories">
          <Shirt className="h-4 w-4" />
          Kategori
        </TabsTrigger>
      </TabsList>
      <TabsContent value="products">
        <ProductsTab isAdmin={isAdmin} />
      </TabsContent>
      <TabsContent value="categories">
        <CategoriesTab isAdmin={isAdmin} />
      </TabsContent>
    </Tabs>
  );
}

// ----------------------------------------------------------------
// Products tab
// ----------------------------------------------------------------

function useDebounce<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function ProductsTab({ isAdmin }: { isAdmin: boolean }) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [categoryId, setCategoryId] = useState("all");
  const [active, setActive] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const qs = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (categoryId !== "all") params.set("categoryId", categoryId);
    if (active !== "all") params.set("active", active);
    return params.toString();
  }, [debouncedSearch, categoryId, active]);

  const qc = useQueryClient();
  const productsQ = useQuery({
    queryKey: ["products", qs],
    queryFn: () => apiGet<Product[]>(`/api/products?${qs}`),
    placeholderData: (prev) => prev,
  });
  const categoriesQ = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<Category[]>("/api/categories"),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/products/${id}`),
    onSuccess: () => {
      toast.success("Produk dihapus.");
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(p: Product) {
    setEditing(p);
    setFormOpen(true);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-end md:p-4">
          <div className="space-y-1.5">
            <Label htmlFor="search">Cari Produk</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                className="pl-8"
                placeholder="Nama atau SKU…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Kategori</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-full md:w-48">
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
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={active} onValueChange={setActive}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Semua" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="true">Aktif</SelectItem>
                <SelectItem value="false">Non-aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            {isAdmin && (
              <Button onClick={openCreate} className="w-full md:w-auto">
                <Plus className="h-4 w-4" />
                Tambah Produk
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[64px]">Gambar</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Harga</TableHead>
                <TableHead className="text-right">Stok</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsQ.isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={isAdmin ? 8 : 7}>
                      <Skeleton className="h-12 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : productsQ.error ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 8 : 7} className="text-destructive">
                    Gagal memuat produk.
                  </TableCell>
                </TableRow>
              ) : (productsQ.data?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 8 : 7} className="text-center text-muted-foreground py-8">
                    Tidak ada produk. {isAdmin && "Klik “Tambah Produk”."}
                  </TableCell>
                </TableRow>
              ) : (
                productsQ.data?.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.imageUrl ? (
                         
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="h-11 w-11 rounded-md border object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                          <Shirt className="h-4 w-4" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.sku}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{p.category?.name || "-"}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatRupiah(p.price)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.totalStock ?? p.variants.reduce((a, v) => a + v.stock, 0)}
                    </TableCell>
                    <TableCell>
                      {p.active ? (
                        <Badge>Aktif</Badge>
                      ) : (
                        <Badge variant="outline">Non-aktif</Badge>
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(p)}
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteTarget(p)}
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
        </CardContent>
      </Card>

      <ProductFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        editing={editing}
        categories={categoriesQ.data ?? []}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus produk?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Produk "${deleteTarget.name}" akan dihapus permanen. Jika sudah pernah terjual, produk akan dinonaktifkan saja.`
                : ""}
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

// ----------------------------------------------------------------
// Product form dialog (create/edit + variants editor + image upload)
// ----------------------------------------------------------------

type FormState = {
  name: string;
  sku: string;
  categoryId: string;
  description: string;
  imageUrl: string | null;
  price: string;
  cost: string;
  lowStockThreshold: string;
  active: boolean;
  hasVariants: boolean;
  variants: ProductVariantInput[];
};

function buildFormState(product: Product | null): FormState {
  if (!product) {
    return {
      name: "",
      sku: "",
      categoryId: "",
      description: "",
      imageUrl: null,
      price: "",
      cost: "",
      lowStockThreshold: "5",
      active: true,
      hasVariants: false,
      variants: [
        { sku: "", size: null, color: null, motif: null, stock: 0 },
      ],
    };
  }
  return {
    name: product.name,
    sku: product.sku,
    categoryId: product.categoryId,
    description: product.description || "",
    imageUrl: product.imageUrl,
    price: String(product.price),
    cost: product.cost ? String(product.cost) : "",
    lowStockThreshold: String(product.lowStockThreshold),
    active: product.active,
    hasVariants: product.hasVariants,
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size ?? null,
      color: v.color ?? null,
      motif: v.motif ?? null,
      stock: v.stock,
    })),
  };
}

function ProductFormDialog(props: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Product | null;
  categories: Category[];
}) {
  const { open, onOpenChange, editing, categories } = props;
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(buildFormState(null));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [validation, setValidation] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(buildFormState(editing));
      setValidation(null);
    }
  }, [open, editing]);

  // Ensure variants array matches hasVariants state (at least 1 entry).
  useEffect(() => {
    setForm((prev) => {
      if (!prev.hasVariants) {
        // simple product: exactly one variant (default)
        if (prev.variants.length === 1 && !prev.variants[0].id) {
          // ok
        } else if (prev.variants.length === 0 || prev.variants.length > 1) {
          return {
            ...prev,
            variants: [
              {
                ...(prev.variants[0] || {}),
                size: null,
                color: null,
                motif: null,
                sku: prev.variants[0]?.sku || prev.sku,
                stock: prev.variants[0]?.stock ?? 0,
              } as ProductVariantInput,
            ],
          };
        }
      } else if (prev.variants.length === 0) {
        return {
          ...prev,
          variants: [
            { sku: "", size: "", color: "", motif: "", stock: 0 },
          ],
        };
      }
      return prev;
    });
  }, [form.hasVariants]);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const url = await apiUploadImage(file);
      setForm((p) => ({ ...p, imageUrl: url }));
      toast.success("Gambar terunggah.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal unggah.");
    } finally {
      setUploading(false);
    }
  }

  function updateVariant(idx: number, patch: Partial<ProductVariantInput>) {
    setForm((p) => {
      const next = [...p.variants];
      next[idx] = { ...next[idx], ...patch };
      return { ...p, variants: next };
    });
  }
  function addVariant() {
    setForm((p) => ({
      ...p,
      variants: [
        ...p.variants,
        { sku: "", size: "", color: "", motif: "", stock: 0 },
      ],
    }));
  }
  function removeVariant(idx: number) {
    setForm((p) => {
      const next = p.variants.filter((_, i) => i !== idx);
      return {
        ...p,
        variants: next.length ? next : [{ sku: "", size: "", color: "", motif: "", stock: 0 }],
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return setValidation("Nama produk wajib diisi.");
    if (!form.sku.trim()) return setValidation("SKU produk wajib diisi.");
    if (!form.categoryId) return setValidation("Kategori wajib dipilih.");
    const price = parseInt(form.price, 10);
    if (!Number.isFinite(price) || price <= 0)
      return setValidation("Harga jual harus > 0.");
    const cost = form.cost ? parseInt(form.cost, 10) : null;

    if (form.variants.length === 0)
      return setValidation("Minimal harus ada 1 varian.");
    for (const v of form.variants) {
      if (!v.sku || !v.sku.trim()) return setValidation("Setiap varian wajib punya SKU.");
      if (!Number.isFinite(v.stock) || v.stock < 0)
        return setValidation("Stok varian tidak valid.");
    }

    const payload: ProductInput = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      categoryId: form.categoryId,
      description: form.description.trim() || null,
      imageUrl: form.imageUrl,
      price,
      cost,
      active: form.active,
      lowStockThreshold: parseInt(form.lowStockThreshold, 10) || 5,
      hasVariants: form.hasVariants,
      variants: form.variants.map((v) => ({
        id: v.id,
        sku: v.sku.trim(),
        size: form.hasVariants ? (v.size?.trim() || null) : null,
        color: form.hasVariants ? (v.color?.trim() || null) : null,
        motif: form.hasVariants ? (v.motif?.trim() || null) : null,
        stock: Math.max(0, Math.round(v.stock || 0)),
      })),
    };

    setSaving(true);
    try {
      if (editing) {
        await apiPatch(`/api/products/${editing.id}`, payload);
        toast.success("Produk diperbarui.");
      } else {
        await apiPost("/api/products", payload);
        toast.success("Produk ditambahkan.");
      }
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      onOpenChange(false);
    } catch (err) {
      setValidation(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto scroll-soft">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
          <DialogDescription>
            Isi detail produk dan varian. Varian merepresentasikan ukuran/warna/motif
            berbeda dengan stok terpisah.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Nama Produk</Label>
              <Input
                id="p-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Kemeja Batik Kawung"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-sku">SKU Produk</Label>
              <Input
                id="p-sku"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="KB-KWG-001"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm({ ...form, categoryId: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-price">Harga Jual (Rp)</Label>
              <Input
                id="p-price"
                type="number"
                inputMode="numeric"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="285000"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-cost">Modal (Rp, opsional)</Label>
              <Input
                id="p-cost"
                type="number"
                inputMode="numeric"
                min={0}
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                placeholder="150000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-low">Batas Stok Menipis</Label>
              <Input
                id="p-low"
                type="number"
                inputMode="numeric"
                min={0}
                value={form.lowStockThreshold}
                onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                placeholder="5"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="p-desc">Deskripsi</Label>
              <Textarea
                id="p-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Kemeja batik lengan panjang, motif kawung klasik…"
                rows={3}
              />
            </div>
          </div>

          {/* Image */}
          <div className="space-y-1.5">
            <Label>Gambar Produk</Label>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-md border bg-muted">
                {form.imageUrl ? (
                   
                  <img
                    src={form.imageUrl}
                    alt="Pratinjau"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <Shirt className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="inline-flex">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(f);
                      e.currentTarget.value = "";
                    }}
                  />
                  <span className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 text-sm shadow-xs hover:bg-accent hover:text-accent-foreground">
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Mengunggah…
                      </>
                    ) : (
                      "Unggah Gambar"
                    )}
                  </span>
                </label>
                {form.imageUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setForm({ ...form, imageUrl: null })}
                  >
                    <X className="h-3.5 w-3.5" />
                    Hapus
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className="space-y-3 rounded-md border border-border bg-card/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Produk Bervarian</Label>
                <p className="text-[11px] text-muted-foreground">
                  Aktifkan jika produk punya variasi (ukuran/warna/motif).
                </p>
              </div>
              <Switch
                checked={form.hasVariants}
                onCheckedChange={(c) => setForm({ ...form, hasVariants: c })}
              />
            </div>

            <div className="space-y-2">
              {form.variants.map((v, i) => (
                <div
                  key={i}
                  className="grid items-end gap-2 rounded-md border border-border/60 bg-background p-2 sm:grid-cols-[1fr_1fr_1fr_1fr_0.8fr_auto]"
                >
                  <div className="space-y-1">
                    <Label className="text-[11px]">SKU Varian</Label>
                    <Input
                      value={v.sku}
                      onChange={(e) => updateVariant(i, { sku: e.target.value })}
                      placeholder="KB-KWG-M"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Ukuran</Label>
                    <Input
                      value={v.size || ""}
                      onChange={(e) => updateVariant(i, { size: e.target.value })}
                      placeholder="M"
                      disabled={!form.hasVariants}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Warna</Label>
                    <Input
                      value={v.color || ""}
                      onChange={(e) => updateVariant(i, { color: e.target.value })}
                      placeholder="Cokelat"
                      disabled={!form.hasVariants}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Motif</Label>
                    <Input
                      value={v.motif || ""}
                      onChange={(e) => updateVariant(i, { motif: e.target.value })}
                      placeholder="Kawung"
                      disabled={!form.hasVariants}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Stok</Label>
                    <Input
                      type="number"
                      min={0}
                      value={v.stock}
                      onChange={(e) =>
                        updateVariant(i, { stock: parseInt(e.target.value, 10) || 0 })
                      }
                    />
                  </div>
                  {form.hasVariants && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVariant(i)}
                      aria-label="Hapus varian"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              {form.hasVariants && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addVariant}
                >
                  <Plus className="h-4 w-4" />
                  Tambah Varian
                </Button>
              )}
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-2">
            <Switch
              checked={form.active}
              onCheckedChange={(c) => setForm({ ...form, active: c })}
            />
            <Label>Produk Aktif (tampil di POS)</Label>
          </div>

          {validation && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <span>{validation}</span>
            </div>
          )}

          <DialogFooter className="sticky bottom-0 bg-background/80 backdrop-blur py-3 -mx-6 px-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button type="submit" disabled={saving || uploading}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan…
                </>
              ) : editing ? (
                "Simpan Perubahan"
              ) : (
                "Tambah Produk"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------
// Categories tab
// ----------------------------------------------------------------

function CategoriesTab({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const categoriesQ = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<Category[]>("/api/categories"),
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const deleteM = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/categories/${id}`),
    onSuccess: () => {
      toast.success("Kategori dihapus.");
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div>
            <p className="font-medium">Daftar Kategori</p>
            <p className="text-xs text-muted-foreground">
              {categoriesQ.data?.length || 0} kategori terdaftar
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
              Tambah Kategori
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="text-right">Produk</TableHead>
                {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoriesQ.isLoading ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 5 : 4}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ) : (categoriesQ.data?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 5 : 4} className="text-center text-muted-foreground py-8">
                    Belum ada kategori.
                  </TableCell>
                </TableRow>
              ) : (
                categoriesQ.data?.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">{c.slug}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.description || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{c._count?.products ?? 0}</Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditing(c);
                              setFormOpen(true);
                            }}
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteTarget(c)}
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
        </CardContent>
      </Card>

      <CategoryFormDialog
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
            <AlertDialogTitle>Hapus kategori?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Kategori "${deleteTarget.name}" akan dihapus permanen.`
                : ""}
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

function CategoryFormDialog(props: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Category | null;
}) {
  const { open, onOpenChange, editing } = props;
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editing?.name || "");
      setDescription(editing?.description || "");
    }
  }, [open, editing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Nama kategori wajib diisi.");
    setSaving(true);
    try {
      const payload = { name: name.trim(), description: description.trim() || null };
      if (editing) {
        await apiPatch(`/api/categories/${editing.id}`, payload);
        toast.success("Kategori diperbarui.");
      } else {
        await apiPost("/api/categories", payload);
        toast.success("Kategori ditambahkan.");
      }
      qc.invalidateQueries({ queryKey: ["categories"] });
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
          <DialogTitle>{editing ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
          <DialogDescription>
            Slug akan dibuat otomatis dari nama.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="c-name">Nama</Label>
            <Input
              id="c-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kemeja Batik"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-desc">Deskripsi (opsional)</Label>
            <Textarea
              id="c-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
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
