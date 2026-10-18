import { db } from "@/lib/db";
import { apiRun, qDate, userGuard } from "@/lib/api-helpers";
import type { SalesTrendPoint } from "@/lib/types";

function pad(n: number, w: number) {
  return String(n).padStart(w, "0");
}

/**
 * GET /api/reports/sales-trend?from=&to=&granularity=day|month → SalesTrendPoint[]
 * label = "YYYY-MM-DD" or "YYYY-MM"
 */
export async function GET(request: Request) {
  return apiRun(async () => {
    await userGuard();
    const url = new URL(request.url);
    const fromParam = qDate(url.searchParams.get("from"));
    const toParam = qDate(url.searchParams.get("to"));
    const granularity =
      url.searchParams.get("granularity") === "month" ? "month" : "day";

    const now = new Date();
    const from = fromParam ?? new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    const to = toParam ?? now;

    const sales = await db.sale.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { items: true },
      orderBy: { createdAt: "asc" },
    });

    const map = new Map<string, SalesTrendPoint>();
    for (const s of sales) {
      const d = s.createdAt;
      const label =
        granularity === "month"
          ? `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}`
          : `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)}`;

      let cost = 0;
      for (const it of s.items) cost += (it.cost || 0) * it.quantity;

      const cur = map.get(label) ?? {
        label,
        revenue: 0,
        profit: 0,
        txCount: 0,
      };
      cur.revenue += s.total;
      cur.profit += s.total - cost;
      cur.txCount += 1;
      map.set(label, cur);
    }

    // Fill missing dates/months between from and to (for continuous charts)
    const labels: string[] = [];
    if (granularity === "day") {
      const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
      const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
      while (cursor <= end) {
        labels.push(
          `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1, 2)}-${pad(cursor.getDate(), 2)}`,
        );
        cursor.setDate(cursor.getDate() + 1);
      }
    } else {
      const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
      const end = new Date(to.getFullYear(), to.getMonth(), 1);
      while (cursor <= end) {
        labels.push(
          `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1, 2)}`,
        );
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }
    const out: SalesTrendPoint[] = labels.map(
      (l) =>
        map.get(l) ?? { label: l, revenue: 0, profit: 0, txCount: 0 },
    );
    return Response.json(out);
  });
}
