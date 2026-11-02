import { db } from "@/lib/db";
import { apiRun, parseJsonBody } from "@/lib/api-helpers";
import crypto from "crypto";

export async function POST(request: Request) {
  return apiRun(async () => {
    const body = await request.json();
    const signature = request.headers.get("x-midtrans-signature");

    if (!signature) throw new Error("Signature missing");

    const orderId =
      body.order_id || body.transaction_id?.split("-")[0];
    if (!orderId) throw new Error("Order ID not found");

    const order = await db.order.findUnique({
      where: { orderNumber: orderId },
    });
    if (!order) throw new Error("Order not found");

    const serverKey = process.env.MIDTRANS_SERVER_KEY!;
    const hash = crypto
      .createHash("sha512")
      .update(
        `${orderId}${body.status_code}${body.gross_amount}${serverKey}`
      )
      .digest("hex");

    if (hash !== signature) throw new Error("Invalid signature");

    const transactionStatus = body.transaction_status;
    let newPaymentStatus = order.paymentStatus;
    let newOrderStatus = order.orderStatus;

    if (
      transactionStatus === "capture" ||
      transactionStatus === "settlement"
    ) {
      newPaymentStatus = "PAID";
      newOrderStatus = "PROCESSING";
    } else if (transactionStatus === "pending") {
      newPaymentStatus = "PENDING_PAYMENT";
    } else if (
      transactionStatus === "deny" ||
      transactionStatus === "cancel" ||
      transactionStatus === "expire"
    ) {
      newPaymentStatus = "FAILED";
    }

    if (
      newPaymentStatus !== order.paymentStatus ||
      newOrderStatus !== order.orderStatus
    ) {
      await db.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: newPaymentStatus,
            orderStatus: newOrderStatus,
          },
        });

        if (newOrderStatus !== order.orderStatus) {
          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              status: newOrderStatus,
              note: `Pembayaran ${transactionStatus}`,
            },
          });
        }
      });
    }

    return Response.json({ status: "ok" });
  });
}
