import { db } from "@/lib/db";
import {
  adminGuard,
  apiRun,
  parseJsonBody,
  qDate,
  qInt,
  userGuard,
} from "@/lib/api-helpers";
import type { StockMovement } from "@/lib/types";

/**
 * GET /api/stock?productId=&variantId=&type=&from=&to=&limit= → StockMovement[]
 * POST /api/stock { productId, variantId?, type, quantity?, newStock?, reason?, supplierId? } → StockMovement [ADMIN]
 */
export async function GET(request: Request) {
  return apiRun(async () => {
    await userGuard();
    const url = new URL(request.url);
    const productId = url.searchParams.get("productId") || undefined;
    const variantId = url.searchParams.get("variantId") || undefined;
    const type = url.searchParams.get("type") || undefined;
    const from = qDate(url.searchParams.get("from"));
    const to = qDate(url.searchParams.get("to"));
    const limit = qInt(url.searchParams.get("limit"), 200);

    const where: Record<string, unknown> = {};
    if (productId) where.productId = productId;
    if (variantId) where.variantId = variantId;
    if (type) where.type = type;
    if (from || to) {
      where.createdAt = {} as Record<string, Date>;
      if (from) (where.createdAt as any).gte = from;
      if (to) (where.createdAt as any).lte = to;
    }

    const list = await db.stockMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 500),
      include: {
        product: { select: { id: true, name: true, sku: true } },
        variant: {
          select: { id: true, sku: true, size: true, color: true, motif: true },
        },
        supplier: true,
      },
    });

    const out: StockMovement[] = list.map((m) => ({
      id: m.id,
      productId: m.productId,
      variantId: m.variantId,
      type: m.type as "IN" | "OUT" | "ADJUST",
      quantity: m.quantity,
      reason: m.reason,
      supplierId: m.supplierId,
      supplier: m.supplier
        ? {
            id: m.supplier.id,
            name: m.supplier.name,
            contact: m.supplier.contact,
            phone: m.supplier.phone,
            address: m.supplier.address,
            notes: m.supplier.notes,
            createdAt: m.supplier.createdAt.toISOString(),
          }
        : null,
      saleId: m.saleId,
      userId: m.userId,
      createdAt: m.createdAt.toISOString(),
      product: m.product,
      variant: m.variant,
    }));
    return Response.json(out);
  });
}

export async function POST(request: Request) {
  return apiRun(async () => {
    const user = await adminGuard();
    const body = await parseJsonBody<{
      productId?: string;
      variantId?: string | null;
      type?: "IN" | "OUT" | "ADJUST";
      quantity?: number;
      newStock?: number;
      reason?: string | null;
      supplierId?: string | null;
    }>(request);

    const productId = (body.productId || "").trim();
    if (!productId) throw new Error("Produk wajib diisi");
    const type = body.type;
    if (!type || !["IN", "OUT", "ADJUST"].includes(type))
      throw new Error("Type harus IN, OUT, atau ADJUST");

    const variantId = body.variantId ? body.variantId.trim() : null;

    // Validate variant belongs to product if given
    type VariantRow = { id: string; productId: string; stock: number };
    let variant: VariantRow | null = null;
    if (variantId) {
      variant = (await db.productVariant.findUnique({
        where: { id: variantId },
        select: { id: true, productId: true, stock: true },
      })) as VariantRow | null;
      if (!variant) throw new Error("Varian tidak ditemukan");
      if (variant.productId !== productId)
        throw new Error("Varian bukan milik produk ini");
    }

    const product = await db.product.findUnique({
      where: { id: productId },
      include: { variants: true },
    });
    if (!product) throw new Error("Produk tidak ditemukan");

    const currentStock = variant ? variant.stock : (product.variants[0]?.stock ?? 0);
    const targetVariantId = variant ? variant.id : product.variants[0]?.id ?? null;
    if (!targetVariantId) {
      throw new Error("Produk ini tidak memiliki varian. Buat varian terlebih dahulu.");
    }

    let delta = 0;
    let storedQty = 0;
    if (type === "IN") {
      const qty = Number(body.quantity);
      if (!Number.isFinite(qty) || qty <= 0)
        throw new Error("Quantity IN harus > 0");
      delta = qty;
      storedQty = qty;
    } else if (type === "OUT") {
      const qty = Number(body.quantity);
      if (!Number.isFinite(qty) || qty <= 0)
        throw new Error("Quantity OUT harus > 0");
      if (currentStock < qty)
        throw new Error(
          `Stok tidak cukup. Saat ini: ${currentStock}, diminta: ${qty}`,
        );
      delta = -qty;
      storedQty = -qty;
    } else {
      // ADJUST
      const newStock = Number(body.newStock);
      if (!Number.isFinite(newStock) || newStock < 0)
        throw new Error("newStock harus >= 0");
      delta = newStock - currentStock;
      storedQty = delta;
    }

    // Update variant stock
    await db.productVariant.update({
      where: { id: targetVariantId },
      data: { stock: { increment: delta } },
    });

    // Validate supplier if given
    let supplierId = body.supplierId ? body.supplierId.trim() : null;
    if (supplierId) {
      const s = await db.supplier.findUnique({ where: { id: supplierId } });
      if (!s) {
        supplierId = null;
      }
    }

    const m = await db.stockMovement.create({
      data: {
        productId,
        variantId: targetVariantId,
        type,
        quantity: storedQty,
        reason: body.reason?.trim() || null,
        supplierId: supplierId || null,
        userId: user.id,
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        variant: {
          select: { id: true, sku: true, size: true, color: true, motif: true },
        },
        supplier: true,
      },
    });

    return Response.json(
      {
        id: m.id,
        productId: m.productId,
        variantId: m.variantId,
        type: m.type as "IN" | "OUT" | "ADJUST",
        quantity: m.quantity,
        reason: m.reason,
        supplierId: m.supplierId,
        supplier: m.supplier
          ? {
              id: m.supplier.id,
              name: m.supplier.name,
              contact: m.supplier.contact,
              phone: m.supplier.phone,
              address: m.supplier.address,
              notes: m.supplier.notes,
              createdAt: m.supplier.createdAt.toISOString(),
            }
          : null,
        saleId: m.saleId,
        userId: m.userId,
        createdAt: m.createdAt.toISOString(),
        product: m.product,
        variant: m.variant,
      },
      { status: 201 },
    );
  });
}
