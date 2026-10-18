import { db } from "@/lib/db";
import { apiRun, userGuard } from "@/lib/api-helpers";
import type { Sale, SaleItem } from "@/lib/types";

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
 * GET /api/sales/:id → Sale (with items)
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return apiRun(async () => {
    await userGuard();
    const { id } = await params;
    const s = await db.sale.findUnique({
      where: { id },
      include: { items: { orderBy: { id: "asc" } } },
    });
    if (!s) return Response.json({ error: "Tidak ditemukan" }, { status: 404 });
    return Response.json(serializeSale(s));
  });
}
