import { db } from "@/lib/db";
import { apiRun, qDate, qInt, userGuard } from "@/lib/api-helpers";
import type { TopProduct } from "@/lib/types";

/**
 * GET /api/reports/top-products?from=&to=&limit=5&categoryId= → TopProduct[]
 */
export async function GET(request: Request) {
  return apiRun(async () => {
    await userGuard();
    const url = new URL(request.url);
    const fromParam = qDate(url.searchParams.get("from"));
    const toParam = qDate(url.searchParams.get("to"));
    const categoryId = url.searchParams.get("categoryId") || undefined;
    const limit = qInt(url.searchParams.get("limit"), 5);

    const now = new Date();
    const from = fromParam ?? new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    const to = toParam ?? now;

    const items = await db.saleItem.findMany({
      where: {
        sale: { createdAt: { gte: from, lte: to } },
        ...(categoryId ? { product: { categoryId } } : {}),
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
      },
    });

    const map = new Map<string, TopProduct>();
    for (const it of items) {
      const p = it.product;
      const cur = map.get(p.id) ?? {
        productId: p.id,
        name: p.name,
        sku: p.sku,
        qty: 0,
        revenue: 0,
        profit: 0,
      };
      cur.qty += it.quantity;
      cur.revenue += it.subtotal;
      cur.profit += it.subtotal - (it.cost || 0) * it.quantity;
      map.set(p.id, cur);
    }

    const sorted = Array.from(map.values()).sort((a, b) => b.qty - a.qty);
    return Response.json(sorted.slice(0, Math.max(1, Math.min(limit, 50))));
  });
}
