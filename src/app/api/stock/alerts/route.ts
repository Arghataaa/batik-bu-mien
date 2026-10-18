import { db } from "@/lib/db";
import { apiRun, userGuard } from "@/lib/api-helpers";
import { variantLabel as buildLabel } from "@/lib/format";
import type { LowStockItem } from "@/lib/types";

/**
 * GET /api/stock/alerts → LowStockItem[]
 * Variants where stock <= product.lowStockThreshold, product active.
 */
export async function GET() {
  return apiRun(async () => {
    await userGuard();
    const variants = await db.productVariant.findMany({
      where: { product: { active: true } },
      include: {
        product: { select: { id: true, name: true, sku: true, lowStockThreshold: true } },
      },
    });

    const out: LowStockItem[] = [];
    for (const v of variants) {
      if (v.stock <= v.product.lowStockThreshold) {
        out.push({
          productId: v.product.id,
          name: v.product.name,
          sku: v.product.sku,
          variantId: v.id,
          variantLabel: (() => {
            const l = buildLabel({ size: v.size, color: v.color, motif: v.motif });
            return l === "" ? null : l;
          })(),
          stock: v.stock,
          lowStockThreshold: v.product.lowStockThreshold,
        });
      }
    }
    // Sort by severity (stock / threshold ascending)
    out.sort(
      (a, b) =>
        a.stock / Math.max(1, a.lowStockThreshold) -
        b.stock / Math.max(1, b.lowStockThreshold),
    );
    return Response.json(out);
  });
}
