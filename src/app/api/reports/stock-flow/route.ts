import { db } from "@/lib/db";
import { apiRun, qDate, userGuard } from "@/lib/api-helpers";
import type { StockFlow } from "@/lib/types";

/**
 * GET /api/reports/stock-flow?from=&to= → StockFlow
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

    const movements = await db.stockMovement.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { product: { select: { cost: true } } },
    });

    let inUnits = 0;
    let outUnits = 0;
    let adjustUnits = 0;
    let inValue = 0;
    let outValue = 0;

    for (const m of movements) {
      const cost = m.product.cost || 0;
      if (m.type === "IN") {
        inUnits += m.quantity;
        inValue += m.quantity * cost;
      } else if (m.type === "OUT") {
        outUnits += Math.abs(m.quantity);
        outValue += Math.abs(m.quantity) * cost;
      } else {
        adjustUnits += m.quantity; // signed
      }
    }

    const out: StockFlow = {
      inUnits,
      outUnits,
      adjustUnits,
      inValue,
      outValue,
    };
    return Response.json(out);
  });
}
