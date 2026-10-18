import { db } from "@/lib/db";
import { apiRun, qDate, userGuard } from "@/lib/api-helpers";
import type { SummaryReport } from "@/lib/types";

/**
 * GET /api/reports/summary?from=&to=&categoryId= → SummaryReport
 */
export async function GET(request: Request) {
  return apiRun(async () => {
    await userGuard();
    const url = new URL(request.url);
    const fromParam = qDate(url.searchParams.get("from"));
    const toParam = qDate(url.searchParams.get("to"));
    const categoryId = url.searchParams.get("categoryId") || undefined;

    const now = new Date();
    const from = fromParam ?? new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    const to = toParam ?? now;

    // Sales + items in range
    const sales = await db.sale.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: {
        items: {
          include: {
            product: { select: { id: true, categoryId: true, cost: true } },
          },
        },
      },
    });

    let omzet = 0;
    let totalCost = 0;
    const saleIds = new Set<string>();

    for (const s of sales) {
      for (const it of s.items) {
        if (categoryId && it.product.categoryId !== categoryId) continue;
        omzet += it.subtotal;
        totalCost += (it.cost || 0) * it.quantity;
        saleIds.add(s.id);
      }
    }
    const profit = omzet - totalCost;
    const txCount = saleIds.size;
    const avgPerTx = txCount > 0 ? Math.round(omzet / txCount) : 0;

    // Stock movements in range
    const movements = await db.stockMovement.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { product: { select: { cost: true } } },
    });

    let stockInUnits = 0;
    let stockOutUnits = 0;
    let adjustUnits = 0;
    let stockInValue = 0;
    let stockOutValue = 0;

    for (const m of movements) {
      const cost = m.product.cost || 0;
      if (m.type === "IN") {
        stockInUnits += m.quantity;
        stockInValue += m.quantity * cost;
      } else if (m.type === "OUT") {
        stockOutUnits += Math.abs(m.quantity);
        stockOutValue += Math.abs(m.quantity) * cost;
      } else if (m.type === "ADJUST") {
        adjustUnits += m.quantity; // signed
      }
    }

    const out: SummaryReport = {
      omzet,
      profit,
      totalCost,
      txCount,
      avgPerTx,
      stockInUnits,
      stockOutUnits,
      stockInValue,
      stockOutValue,
      cogsSold: totalCost,
    };
    return Response.json(out);
  });
}
