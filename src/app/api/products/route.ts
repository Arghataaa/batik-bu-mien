import { db } from "@/lib/db";
import { adminGuard, apiRun, parseJsonBody, userGuard } from "@/lib/api-helpers";
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

/**
 * GET /api/products?search=&categoryId=&active= → Product[] (include category + variants + totalStock)
 * POST /api/products { name, sku, categoryId, description?, imageUrl?, price, cost?, active?, lowStockThreshold?, hasVariants, variants:[...] } → Product [ADMIN]
 */
export async function GET(request: Request) {
  return apiRun(async () => {
    await userGuard();
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim() || "";
    const categoryId = url.searchParams.get("categoryId") || undefined;
    const activeParam = url.searchParams.get("active");
    let active: boolean | undefined;
    if (activeParam === "true") active = true;
    else if (activeParam === "false") active = false;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (active !== undefined) where.active = active;

    const products = await db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        variants: { orderBy: { createdAt: "asc" } },
      },
    });

    const out: Product[] = products.map((p) => ({
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
      variants: p.variants.map((v) => ({
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
    }));
    return Response.json(out);
  });
}

export async function POST(request: Request) {
  return apiRun(async () => {
    await adminGuard();
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

    const name = (body.name || "").trim();
    if (!name) throw new Error("Nama produk wajib diisi");
    const sku = (body.sku || "").trim();
    if (!sku) throw new Error("SKU produk wajib diisi");
    const categoryId = (body.categoryId || "").trim();
    if (!categoryId) throw new Error("Kategori wajib diisi");
    if (body.price == null || body.price < 0)
      throw new Error("Harga jual wajib diisi dan >= 0");

    const hasVariants = !!body.hasVariants;
    const variantsIn = Array.isArray(body.variants) ? body.variants : [];
    if (variantsIn.length === 0)
      throw new Error("Minimal 1 varian wajib diisi");

    // Validate unique SKU across variants
    const skus = variantsIn.map((v) => (v.sku || "").trim()).filter(Boolean);
    if (skus.length !== variantsIn.length)
      throw new Error("Setiap varian wajib memiliki SKU");

    // Pre-check global SKU uniqueness
    const existingSku = await db.productVariant.findFirst({
      where: { sku: { in: skus } },
    });
    if (existingSku)
      throw new Error(`SKU varian sudah dipakai: ${existingSku.sku}`);

    const productSkuExists = await db.product.findUnique({ where: { sku } });
    if (productSkuExists) throw new Error("SKU produk sudah dipakai");

    const category = await db.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new Error("Kategori tidak ditemukan");

    // If hasVariants=false, force a single default variant
    let variantsToCreate: VariantInput[];
    if (!hasVariants) {
      if (variantsIn.length !== 1)
        throw new Error(
          "Produk tanpa varian harus memiliki tepat 1 varian default",
        );
      variantsToCreate = [
        {
          ...variantsIn[0],
          size: null,
          color: null,
          motif: null,
        },
      ];
    } else {
      variantsToCreate = variantsIn;
    }

    const lowStockThreshold =
      body.lowStockThreshold != null ? Number(body.lowStockThreshold) : 5;
    const costRaw: unknown = body.cost;
    const cost =
      typeof costRaw === "string"
        ? costRaw.trim() === ""
          ? null
          : Number(costRaw)
        : costRaw != null
          ? Number(costRaw)
          : null;

    const product = await db.product.create({
      data: {
        name,
        sku,
        categoryId,
        description: body.description?.trim() || null,
        imageUrl: body.imageUrl?.trim() || null,
        price: Number(body.price),
        cost: cost != null ? cost : null,
        active: body.active !== undefined ? !!body.active : true,
        lowStockThreshold,
        hasVariants,
        variants: {
          create: variantsToCreate.map((v) => ({
            sku: (v.sku || "").trim(),
            size: hasVariants ? v.size?.trim() || null : null,
            color: hasVariants ? v.color?.trim() || null : null,
            motif: hasVariants ? v.motif?.trim() || null : null,
            stock: Number(v.stock || 0),
          })),
        },
      },
      include: {
        category: true,
        variants: { orderBy: { createdAt: "asc" } },
      },
    });

    // Create initial IN stock movements for variants with starting stock > 0
    for (const v of product.variants) {
      const inputV = variantsToCreate.find((iv) => iv.sku === v.sku);
      const qty = Number(inputV?.stock || 0);
      if (qty > 0) {
        await db.stockMovement.create({
          data: {
            productId: product.id,
            variantId: v.id,
            type: "IN",
            quantity: qty,
            reason: "Stok awal",
          },
        });
      }
    }

    const refreshed = await db.product.findUnique({
      where: { id: product.id },
      include: { category: true, variants: { orderBy: { createdAt: "asc" } } },
    });
    return Response.json(
      {
        id: refreshed!.id,
        name: refreshed!.name,
        sku: refreshed!.sku,
        categoryId: refreshed!.categoryId,
        category: refreshed!.category,
        description: refreshed!.description,
        imageUrl: refreshed!.imageUrl,
        price: refreshed!.price,
        cost: refreshed!.cost,
        active: refreshed!.active,
        lowStockThreshold: refreshed!.lowStockThreshold,
        hasVariants: refreshed!.hasVariants,
        variants: refreshed!.variants,
        createdAt: refreshed!.createdAt,
        updatedAt: refreshed!.updatedAt,
        totalStock: computeTotalStock(refreshed!.variants),
      },
      { status: 201 },
    );
  });
}
