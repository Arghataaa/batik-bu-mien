import { db } from "@/lib/db";
import { apiRun, parseJsonBody } from "@/lib/api-helpers";
import MidtransClient from "midtrans-client";

export async function POST(request: Request) {
  return apiRun(async () => {
    const body = await parseJsonBody<{ orderId: string }>(request);
    const { orderId } = body;

    if (!orderId) throw new Error("Order ID diperlukan");

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new Error("Order tidak ditemukan");
    if (order.paymentStatus === "PAID" || ["CANCELLED", "EXPIRED", "SHIPPED", "COMPLETED"].includes(order.orderStatus))
      throw new Error("Pesanan tidak dapat dibayar atau sudah diproses");
    if (order.shippingCost <= 0)
      throw new Error("Biaya ongkir belum ditentukan");
    if (order.snapToken && order.paymentStatus === "PENDING_PAYMENT") {
      return { token: order.snapToken, redirectUrl: null };
    }
    if (!['PENDING_SHIPPING', 'PENDING_PAYMENT'].includes(order.paymentStatus))
      throw new Error("Status pembayaran tidak valid");

    const snap = new MidtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
      serverKey: process.env.MIDTRANS_SERVER_KEY!,
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!,
    });

    const parameter = {
      transaction_details: {
        order_id: order.orderNumber,
        gross_amount: order.total,
      },
      item_details: order.items.map((item) => ({
        id: item.id,
        price: item.price,
        quantity: item.quantity,
        name: item.name,
      })),
      customer_details: {
        first_name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
        billing_address: {
          address: order.address,
          city: order.city,
          postal_code: order.postalCode,
          country_code: "IDN",
        },
      },
      callbacks: {
        finish: `${process.env.NEXTAUTH_URL}/pesanan/${order.trackingToken}`,
        error: `${process.env.NEXTAUTH_URL}/pesanan/${order.trackingToken}`,
        pending: `${process.env.NEXTAUTH_URL}/pesanan/${order.trackingToken}`,
      },
    };

    const token = await snap.createTransaction(parameter);

    await db.order.update({
      where: { id: orderId },
      data: {
        snapToken: token.token,
        paymentOrderId: token.redirect_url?.split("order_id=")[1]?.split("&")[0],
        paymentStatus: "PENDING_PAYMENT",
      },
    });

    return Response.json({
      token: token.token,
      redirectUrl: token.redirect_url,
    });
  });
}
