import { db } from "@/lib/db";
import { apiRun, userGuard } from "@/lib/api-helpers";
import { variantLabel as buildLabel } from "@/lib/format";
import type { InsightReport } from "@/lib/types";

const MS_DAY = 24 * 3600 * 1000;

/**
 * GET /api/insights → InsightReport
 */
export async function GET() {
  return apiRun(async () => {
    await userGuard();
    const now = new Date();
    const start60 = new Date(now.getTime() - 60 * MS_DAY);
    const start30 = new Date(now.getTime() - 30 * MS_DAY);
    const start28 = new Date(now.getTime() - 28 * MS_DAY);
    const start14 = new Date(now.getTime() - 14 * MS_DAY);

    // Sales in last 60d for insufficiency check
    const sales60 = await db.sale.findMany({
      where: { createdAt: { gte: start60, lte: now } },
      select: { id: true, createdAt: true },
    });
    const distinctDays = new Set<string>();
    for (const s of sales60) {
      const d = s.createdAt;
      distinctDays.add(
        `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
      );
    }
    const insufficientData =
      distinctDays.size < 14 || sales60.length < 5;

    if (insufficientData) {
      const out: InsightReport = {
        insufficientData: true,
        message:
          "Data penjualan belum cukup untuk insight. Butuh minimal 14 hari penjualan dan 5 transaksi dalam 60 hari terakhir.",
        restock: [],
        topSellers: [],
        declining: [],
      };
      return Response.json(out);
    }

    // SaleItems last 30d (for velocity + topSellers)
    const items30 = await db.saleItem.findMany({
      where: { sale: { createdAt: { gte: start30, lte: now } } },
      include: {
        product: { select: { id: true, name: true, sku: true } },
      },
    });
    // velocity per variant
    const qtyByVariant = new Map<string, number>();
    const qtyByProduct30 = new Map<
      string,
      { productId: string; name: string; sku: string; qty: number; revenue: number; profit: number }
    >();
    for (const it of items30) {
      const vid = it.variantId ?? "";
      qtyByVariant.set(vid, (qtyByVariant.get(vid) ?? 0) + it.quantity);
      const pid = it.product.id;
      const cur = qtyByProduct30.get(pid) ?? {
        productId: pid,
        name: it.product.name,
        sku: it.product.sku,
        qty: 0,
        revenue: 0,
        profit: 0,
      };
      cur.qty += it.quantity;
      cur.revenue += it.subtotal;
      cur.profit += it.subtotal - (it.cost || 0) * it.quantity;
      qtyByProduct30.set(pid, cur);
    }
    const topSellers = Array.from(qtyByProduct30.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // Restock candidates: all active variants
    const variants = await db.productVariant.findMany({
      where: { product: { active: true } },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            lowStockThreshold: true,
          },
        },
      },
    });
    const restock: InsightReport["restock"] = [];
    for (const v of variants) {
      const velocity30d =
        (qtyByVariant.get(v.id) ?? 0) / 30;
      const daysUntilOut =
        velocity30d > 0 ? v.stock / velocity30d : Infinity;
      const isLow = v.stock <= v.product.lowStockThreshold;
      const isDepletingSoon =
        velocity30d > 0 && daysUntilOut <= 7;
      if (!isLow && !isDepletingSoon) continue;

      const label = buildLabel({
        size: v.size,
        color: v.color,
        motif: v.motif,
      });
      let recommendation: string;
      if (isLow && v.stock === 0) {
        recommendation = "Stok habis. Segera lakukan pembelian ulang.";
      } else if (isLow) {
        recommendation = `Stok di bawah ambang batas (${v.stock}/${v.product.lowStockThreshold}). Segera lakukan pembelian ulang.`;
      } else {
        recommendation = `Dengan kecepatan penjualan ${velocity30d.toFixed(2)}/hari, stok akan habis dalam ~${Math.ceil(daysUntilOut)} hari. Pertimbangkan restok.`;
      }

      restock.push({
        productId: v.product.id,
        name: v.product.name,
        variantId: v.id,
        variantLabel: label === "" ? null : label,
        stock: v.stock,
        lowStockThreshold: v.product.lowStockThreshold,
        velocity30d: Number(velocity30d.toFixed(3)),
        recommendation,
      });
    }
    restock.sort((a, b) => a.stock - b.stock);

    // Declining: prev (28-14d ago) vs last (14-0d)
    const itemsPrev = await db.saleItem.findMany({
      where: {
        sale: { createdAt: { gte: start28, lt: start14 } },
      },
      select: {
        productId: true,
        quantity: true,
        product: { select: { id: true, name: true, sku: true } },
      },
    });
    const itemsLast = await db.saleItem.findMany({
      where: {
        sale: { createdAt: { gte: start14, lte: now } },
      },
      select: {
        productId: true,
        quantity: true,
        product: { select: { id: true, name: true, sku: true } },
      },
    });

    const prevMap = new Map<string, { qty: number; product: any }>();
    for (const it of itemsPrev) {
      const cur = prevMap.get(it.productId) ?? {
        qty: 0,
        product: it.product,
      };
      cur.qty += it.quantity;
      prevMap.set(it.productId, cur);
    }
    const lastMap = new Map<string, number>();
    for (const it of itemsLast) {
      lastMap.set(it.productId, (lastMap.get(it.productId) ?? 0) + it.quantity);
    }

    const declining: {
      productId: string;
      name: string;
      sku: string;
      prevQty: number;
      lastQty: number;
      changePct: number;
    }[] = [];
    for (const [pid, info] of prevMap.entries()) {
      if (info.qty < 5) continue;
      const lastQty = lastMap.get(pid) ?? 0;
      const changePct =
        info.qty > 0 ? ((lastQty - info.qty) / info.qty) * 100 : 0;
      if (changePct < -30) {
        declining.push({
          productId: pid,
          name: info.product.name,
          sku: info.product.sku,
          prevQty: info.qty,
          lastQty,
          changePct: Number(changePct.toFixed(1)),
        });
      }
    }
    declining.sort((a, b) => a.changePct - b.changePct);

    const out: InsightReport = {
      insufficientData: false,
      restock,
      topSellers,
      declining,
    };
    return Response.json(out);
  });
}
