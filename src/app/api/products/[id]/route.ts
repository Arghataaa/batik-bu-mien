import { db } from "@/lib/db";
import {
  adminGuard,
  apiRun,
  parseJsonBody,
  userGuard,
} from "@/lib/api-helpers";
import type { Product } from "@/lib/types";

type VariantInput = {
  id?: string;
  sku?: string;
  size?: string | null;
  color?: string | null;
  motif?: string | null;
  stock?: number;
};

function computeTotalStock(variants: { stock: number }[]): number {
  return variants.reduce((s, v) => s + (v.stock || 0), 0);
}

function toProductOut(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    categoryId: p.categoryId,
    category: p.category
      ? {
          id: p.category.id,
          name: p.category.name,
          slug: p.category.slug,
          description: p.category.description,
          createdAt: p.category.createdAt.toISOString(),
        }
      : undefined,
    description: p.description,
    imageUrl: p.imageUrl,
    price: p.price,
    cost: p.cost,
    active: p.active,
    lowStockThreshold: p.lowStockThreshold,
    hasVariants: p.hasVariants,
    variants: p.variants.map((v: any) => ({
      id: v.id,
      productId: v.productId,
      sku: v.sku,
      size: v.size,
      color: v.color,
      motif: v.motif,
      stock: v.stock,
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
    })),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    totalStock: computeTotalStock(p.variants),
  };
}

/**
 * GET /api/products/:id → Product (with variants)
 * PATCH /api/products/:id { ...fields, variants? } → Product [ADMIN]
 * DELETE /api/products/:id → { ok:true } [ADMIN]; soft set active=false if sales exist
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return apiRun(async () => {
    await userGuard();
    const { id } = await params;
    const p = await db.product.findUnique({
      where: { id },
      include: { category: true, variants: { orderBy: { createdAt: "asc" } } },
    });
    if (!p) return Response.json({ error: "Tidak ditemukan" }, { status: 404 });
    return Response.json(toProductOut(p));
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return apiRun(async () => {
    await adminGuard();
    const { id } = await params;
    const body = await parseJsonBody<{
      name?: string;
      sku?: string;
      categoryId?: string;
      description?: string | null;
      imageUrl?: string | null;
      price?: number;
      cost?: number | null;
      active?: boolean;
      lowStockThreshold?: number;
      hasVariants?: boolean;
      variants?: VariantInput[];
    }>(request);

    const existing = await db.product.findUnique({
      where: { id },
      include: { variants: true },
    });
    if (!existing)
      return Response.json({ error: "Tidak ditemukan" }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (body.name != null) {
      const name = body.name.trim();
      if (!name) throw new Error("Nama produk wajib diisi");
      data.name = name;
    }
    if (body.sku != null) {
      const sku = body.sku.trim();
      if (!sku) throw new Error("SKU produk wajib diisi");
      const conflict = await db.product.findFirst({
        where: { sku, NOT: { id } },
      });
      if (conflict) throw new Error("SKU produk sudah dipakai");
      data.sku = sku;
    }
    if (body.categoryId != null) {
      const cat = await db.category.findUnique({
        where: { id: body.categoryId },
      });
      if (!cat) throw new Error("Kategori tidak ditemukan");
      data.categoryId = body.categoryId;
    }
    if (body.description != null)
      data.description = body.description.trim() || null;
    if (body.imageUrl != null) data.imageUrl = body.imageUrl.trim() || null;
    if (body.price != null) {
      const p = Number(body.price);
      if (p < 0) throw new Error("Harga tidak boleh negatif");
      data.price = p;
    }
    if (body.cost != null) {
      const cRaw: unknown = body.cost;
      const c =
        typeof cRaw === "string"
          ? cRaw.trim() === ""
            ? null
            : Number(cRaw)
          : Number(cRaw);
      data.cost = c;
    }
    if (body.active != null) data.active = !!body.active;
    if (body.lowStockThreshold != null) {
      const t = Number(body.lowStockThreshold);
      if (t < 0) throw new Error("Threshold stok tidak boleh negatif");
      data.lowStockThreshold = t;
    }
    if (body.hasVariants != null) data.hasVariants = !!body.hasVariants;

    // Variants merge
    if (Array.isArray(body.variants)) {
      const incoming = body.variants as VariantInput[];
      const incomingIds = new Set(
        incoming.filter((v) => v.id).map((v) => v.id as string),
      );
      // Validate SKU uniqueness among incoming
      const skus = incoming.map((v) => (v.sku || "").trim()).filter(Boolean);
      if (skus.length !== incoming.length)
        throw new Error("Setiap varian wajib memiliki SKU");
      const dupInSku = skus.some(
        (s, i) => skus.indexOf(s) !== i,
      );
      if (dupInSku) throw new Error("SKU varian harus unik");

      // Check global SKU conflicts (excluding this product's existing variants)
      const conflicting = await db.productVariant.findFirst({
        where: { sku: { in: skus }, productId: { not: id } },
      });
      if (conflicting)
        throw new Error(`SKU varian sudah dipakai: ${conflicting.sku}`);

      // Delete missing variants (only if no saleItems reference them)
      const toDelete = existing.variants.filter((v) => !incomingIds.has(v.id));
      for (const v of toDelete) {
        const refCount = await db.saleItem.count({
          where: { variantId: v.id },
        });
        if (refCount === 0) {
          await db.stockMovement.deleteMany({
            where: { variantId: v.id },
          });
          await db.productVariant.delete({ where: { id: v.id } });
        }
      }

      // Update existing + create new
      for (const v of incoming) {
        if (v.id) {
          const existingV = existing.variants.find((x) => x.id === v.id);
          if (!existingV) throw new Error(`Varian id tidak ditemukan: ${v.id}`);
          await db.productVariant.update({
            where: { id: v.id },
            data: {
              sku: (v.sku || "").trim(),
              size: v.size?.trim() || null,
              color: v.color?.trim() || null,
              motif: v.motif?.trim() || null,
              stock: Number(v.stock ?? existingV.stock),
            },
          });
        } else {
          await db.productVariant.create({
            data: {
              productId: id,
              sku: (v.sku || "").trim(),
              size: v.size?.trim() || null,
              color: v.color?.trim() || null,
              motif: v.motif?.trim() || null,
              stock: Number(v.stock || 0),
            },
          });
        }
      }
    }

    const updated = await db.product.update({
      where: { id },
      data,
      include: { category: true, variants: { orderBy: { createdAt: "asc" } } },
    });
    return Response.json(toProductOut(updated));
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return apiRun(async () => {
    await adminGuard();
    const { id } = await params;
    const p = await db.product.findUnique({
      where: { id },
      include: { _count: { select: { saleItems: true } } },
    });
    if (!p)
      return Response.json({ error: "Tidak ditemukan" }, { status: 404 });

    if (p._count.saleItems > 0) {
      // Soft delete
      const updated = await db.product.update({
        where: { id },
        data: { active: false },
      });
      return Response.json({ ok: true, active: false, id: updated.id });
    }

    // Hard delete: remove movements + variants + product
    await db.stockMovement.deleteMany({ where: { productId: id } });
    await db.productVariant.deleteMany({ where: { productId: id } });
    await db.product.delete({ where: { id } });
    return Response.json({ ok: true, active: null, id });
  });
}
