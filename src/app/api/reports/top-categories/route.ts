import { db } from "@/lib/db";
import { apiRun, qDate, userGuard } from "@/lib/api-helpers";
import type { TopCategory } from "@/lib/types";

/**
 * GET /api/reports/top-categories?from=&to= → TopCategory[]
 */
export async function GET(request: Request) {
  return apiRun(async () => {
    await userGuard();
    const url = new URL(request.url);
    const fromParam = qDate(url.searchParams.get("from"));
    const toParam = qDate(url.searchParams.get("to"));

    const now = new Date();
    const from = fromParam ?? new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    const to = toParam ?? now;

    const items = await db.saleItem.findMany({
      where: { sale: { createdAt: { gte: from, lte: to } } },
      include: {
        product: {
          select: {
            id: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
    });

    const map = new Map<string, TopCategory>();
    for (const it of items) {
      const c = it.product.category;
      if (!c) continue;
      const cur = map.get(c.id) ?? {
        categoryId: c.id,
        name: c.name,
        qty: 0,
        revenue: 0,
        profit: 0,
      };
      cur.qty += it.quantity;
      cur.revenue += it.subtotal;
      cur.profit += it.subtotal - (it.cost || 0) * it.quantity;
      map.set(c.id, cur);
    }
    const sorted = Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
    return Response.json(sorted);
  });
}
