import { db } from "@/lib/db";
import { apiRun } from "@/lib/api-helpers";

export async function GET(request: Request) {
  return apiRun(async () => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";
    const paymentStatus = url.searchParams.get("paymentStatus") || "";

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.orderStatus = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const orders = await db.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return Response.json(orders);
  });
}

export async function PATCH(request: Request) {
  return apiRun(async () => {
    const body = await request.json();
    const { orderId, shippingCost, orderStatus, courier, trackingNumber, adminNote } = body;

    if (!orderId) throw new Error("Order ID diperlukan");

    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order tidak ditemukan");

    const updates: Record<string, unknown> = {};
    if (shippingCost !== undefined) updates.shippingCost = shippingCost;
    if (shippingCost !== undefined) updates.total = order.subtotal + shippingCost - order.discount;
    if (orderStatus) updates.orderStatus = orderStatus;
    if (courier) updates.courier = courier;
    if (trackingNumber) updates.trackingNumber = trackingNumber;
    if (adminNote !== undefined) updates.adminNote = adminNote;

    const updated = await db.$transaction(async (tx) => {
      const res = await tx.order.update({ where: { id: orderId }, data: updates, include: { items: true, statusHistory: true } });
      
      if (orderStatus && orderStatus !== order.orderStatus) {
        await tx.orderStatusHistory.create({
          data: { orderId, status: orderStatus, note: adminNote },
        });
      }

      return res;
    });

    return Response.json(updated);
  });
}
