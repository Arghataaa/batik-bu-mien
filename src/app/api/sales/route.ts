import { db } from "@/lib/db";
import {
  apiRun,
  parseJsonBody,
  qDate,
  qInt,
  userGuard,
} from "@/lib/api-helpers";
import { variantLabel as buildLabel } from "@/lib/format";
import type { Sale, SaleItem } from "@/lib/types";

type ItemInput = {
  productId?: string;
  variantId?: string | null;
  quantity?: number;
};

function pad(n: number, w: number) {
  return String(n).padStart(w, "0");
}

function serializeSale(s: any): Sale {
  return {
    id: s.id,
    invoiceNo: s.invoiceNo,
    total: s.total,
    totalCost: s.totalCost,
    totalProfit: s.totalProfit,
    paymentMethod: s.paymentMethod,
    paidAmount: s.paidAmount,
    changeAmount: s.changeAmount,
    userId: s.userId,
    customerName: s.customerName,
    note: s.note,
    createdAt: s.createdAt.toISOString(),
    items: (s.items as any[]).map((i): SaleItem => ({
      id: i.id,
      saleId: i.saleId,
      productId: i.productId,
      variantId: i.variantId,
      name: i.name,
      sku: i.sku,
      variantLabel: i.variantLabel,
      price: i.price,
      cost: i.cost,
      quantity: i.quantity,
      subtotal: i.subtotal,
    })),
  };
}

/**
 * GET /api/sales?from=&to=&limit=50 → Sale[]
 * POST /api/sales { items:[{productId,variantId,quantity}], paymentMethod, paidAmount, customerName?, note? } → { sale: Sale }
 *   ATOMIC via db.$transaction.
 */
export async function GET(request: Request) {
  return apiRun(async () => {
    await userGuard();
    const url = new URL(request.url);
    const from = qDate(url.searchParams.get("from"));
    const to = qDate(url.searchParams.get("to"));
    const limit = qInt(url.searchParams.get("limit"), 50);

    const where: Record<string, unknown> = {};
    if (from || to) {
      where.createdAt = {} as Record<string, Date>;
      if (from) (where.createdAt as any).gte = from;
      if (to) (where.createdAt as any).lte = to;
    }

    const list = await db.sale.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 200),
      include: { items: { orderBy: { id: "asc" } } },
    });
    return Response.json(list.map(serializeSale));
  });
}

export async function POST(request: Request) {
  return apiRun(async () => {
    const user = await userGuard();
    const body = await parseJsonBody<{
      items?: ItemInput[];
      paymentMethod?: string;
      paidAmount?: number;
      customerName?: string | null;
      note?: string | null;
    }>(request);

    if (!Array.isArray(body.items) || body.items.length === 0)
      throw new Error("Item penjualan wajib diisi");
    const payment = (body.paymentMethod || "CASH").toUpperCase();
    if (!["CASH", "QRIS", "DEBIT", "TRANSFER"].includes(payment))
      throw new Error("Metode pembayaran tidak valid");

    const paidAmount = Number(body.paidAmount ?? 0);
    if (!Number.isFinite(paidAmount) || paidAmount < 0)
      throw new Error("paidAmount wajib diisi dan >= 0");

    const userId = user.id;

    // Retry loop to guarantee a unique invoice number even under concurrency.
    // invoiceNo uses a globally-incrementing sequence (count of all sales + 1001)
    // which is collision-free against seeded historical data.
    let lastErr: unknown;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const sale = await runSaleTransaction(body, paidAmount, payment, userId);
        return Response.json({ sale: serializeSale(sale) }, { status: 201 });
      } catch (e: any) {
        const msg = String(e?.message || "");
        if (msg.includes("Unique constraint") && msg.includes("invoiceNo")) {
          lastErr = e;
          // small jitter then retry
          await new Promise((r) => setTimeout(r, 30 * (attempt + 1)));
          continue;
        }
        throw e;
      }
    }
    throw lastErr ?? new Error("Gagal membuat transaksi penjualan");
  });
}

async function runSaleTransaction(
  body: { items?: ItemInput[]; customerName?: string | null; note?: string | null },
  paidAmount: number,
  payment: string,
  userId: string
) {
  return db.$transaction(async (tx) => {
      // Validate each item + compute snapshots
      const lines: {
        productId: string;
        variantId: string;
        name: string;
        sku: string;
        variantLabel: string | null;
        price: number;
        cost: number;
        quantity: number;
        subtotal: number;
        costLine: number;
      }[] = [];

      let total = 0;
      let totalCost = 0;

      for (const item of body.items as ItemInput[]) {
        const productId = (item.productId || "").trim();
        const variantId = (item.variantId || "").trim();
        const quantity = Number(item.quantity);
        if (!productId) throw new Error("productId wajib diisi pada item");
        if (!variantId) throw new Error("variantId wajib diisi pada item");
        if (!Number.isFinite(quantity) || quantity <= 0)
          throw new Error("Quantity harus > 0");

        const product = await tx.product.findUnique({
          where: { id: productId },
        });
        if (!product) throw new Error("Produk tidak ditemukan");

        // Fresh read of variant with current stock
        const variant = await tx.productVariant.findUnique({
          where: { id: variantId },
        });
        if (!variant) throw new Error("Varian tidak ditemukan");
        if (variant.productId !== productId)
          throw new Error("Varian bukan milik produk ini");

        if (variant.stock < quantity) {
          const label = buildLabel({
            size: variant.size,
            color: variant.color,
            motif: variant.motif,
          });
          const labelStr = label ? ` (${label})` : "";
          throw new Error(
            `Stok tidak cukup untuk ${product.name}${labelStr}. Tersisa ${variant.stock}, diminta ${quantity}`,
          );
        }

        const price = product.price;
        const cost = product.cost ?? 0;
        const subtotal = price * quantity;
        const costLine = cost * quantity;
        const label = buildLabel({
          size: variant.size,
          color: variant.color,
          motif: variant.motif,
        });

        lines.push({
          productId,
          variantId,
          name: product.name,
          sku: variant.sku,
          variantLabel: label === "" ? null : label,
          price,
          cost,
          quantity,
          subtotal,
          costLine,
        });

        total += subtotal;
        totalCost += costLine;

        // Decrement stock now (so concurrent transactions see updated state)
        await tx.productVariant.update({
          where: { id: variantId },
          data: { stock: { decrement: quantity } },
        });
      }

      const totalProfit = total - totalCost;
      const changeAmount = Math.max(0, paidAmount - total);

      // Generate invoice number INV-YYYYMM-NNNN using a globally-incrementing
      // sequence (count of all sales + 1001). This is collision-free against
      // the seeded historical data (which also used a global counter 1001..1042).
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = now.getMonth() + 1;
      const globalCount = await tx.sale.count();
      const invoiceNo = `INV-${yyyy}${pad(mm, 2)}-${pad(globalCount + 1001, 4)}`;

      // Create Sale
      const saleRow = await tx.sale.create({
        data: {
          invoiceNo,
          total,
          totalCost,
          totalProfit,
          paymentMethod: payment,
          paidAmount,
          changeAmount,
          userId,
          customerName: body.customerName?.trim() || null,
          note: body.note?.trim() || null,
          items: {
            create: lines.map((l) => ({
              productId: l.productId,
              variantId: l.variantId,
              name: l.name,
              sku: l.sku,
              variantLabel: l.variantLabel,
              price: l.price,
              cost: l.cost,
              quantity: l.quantity,
              subtotal: l.subtotal,
            })),
          },
        },
        include: { items: { orderBy: { id: "asc" } } },
      });

      // Create OUT stock movements (quantity negative)
      for (const l of lines) {
        await tx.stockMovement.create({
          data: {
            productId: l.productId,
            variantId: l.variantId,
            type: "OUT",
            quantity: -l.quantity,
            reason: "Penjualan",
            saleId: saleRow.id,
            userId,
          },
        });
      }

      return saleRow;
    });
}
