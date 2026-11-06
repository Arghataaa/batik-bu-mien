import { db } from "@/lib/db";
import MidtransClient from "midtrans-client";
import { sendTelegramMessage } from "@/lib/telegram";

const money = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
const blockedOrderStatuses = new Set(["CANCELLED", "EXPIRED", "SHIPPED", "COMPLETED", "PAID"]);

function canSetShipping(order: { paymentStatus: string; orderStatus: string; shippingCost: number }) {
  return order.paymentStatus !== "PAID" && !blockedOrderStatuses.has(order.orderStatus);
}

async function createSnapToken(order: {
  orderNumber: string; total: number; customerName: string; customerEmail: string; customerPhone: string; trackingToken: string;
  items: { id: string; price: number; quantity: number; name: string }[];
}, shippingCost: number) {
  const snap = new MidtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
    serverKey: process.env.MIDTRANS_SERVER_KEY!,
    clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!,
  });
  const token = await snap.createTransaction({
    transaction_details: { order_id: order.orderNumber, gross_amount: order.total },
    item_details: [...order.items.map((i) => ({ id: i.id, price: i.price, quantity: i.quantity, name: i.name })), { id: "SHIPPING", price: shippingCost, quantity: 1, name: "Ongkos Kirim" }],
    customer_details: { first_name: order.customerName, email: order.customerEmail, phone: order.customerPhone },
    callbacks: { finish: `${process.env.NEXTAUTH_URL}/pesanan/${order.trackingToken}` },
  });
  return token.token;
}

export async function POST(request: Request) {
  try {
    const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
    if (!configuredSecret || request.headers.get("x-telegram-bot-api-secret-token") !== configuredSecret) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const adminId = String(process.env.TELEGRAM_ADMIN_ID || "").trim();
    
    if (body.callback_query) {
      const cq = body.callback_query;
      if (String(cq.from?.id || "").trim() !== adminId) return Response.json({ ok: true });
      const data = String(cq.data || "");

      // Handle Manual Confirmation
      if (data.startsWith("confirm_ongkir:")) {
        const [_, orderId, ongkir] = data.split(":");
        const cost = parseInt(ongkir);
        
        await db.$transaction(async (tx) => {
            const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
            if (!order || !canSetShipping(order)) throw new Error("Pesanan tidak dapat diproses");
            
            const total = order.subtotal + cost - order.discount;
            const snapToken = await createSnapToken({ ...order, total }, cost);
            
            await tx.order.update({ 
                where: { id: order.id }, 
                data: { shippingCost: cost, total, snapToken, orderStatus: "WAITING_PAYMENT" } 
            });
            await tx.orderStatusHistory.create({ data: { orderId: order.id, status: "WAITING_PAYMENT", note: `Ongkir manual dikonfirmasi: ${money(cost)}` } });
            await sendTelegramMessage(`<b>Ongkir Dikonfirmasi</b>\nOrder: ${order.orderNumber}\nOngkir: ${money(cost)}\nTotal: ${money(total)}`);
        });
        return Response.json({ ok: true });
      }
      return Response.json({ ok: true });
    }

    const message = body.message;
    if (!message?.text || String(message.from?.id || "").trim() !== adminId) return Response.json({ ok: true });
    
    const args = String(message.text).trim().split(/\s+/);
    if (args[0].split("@")[0] === "/ongkir") {
        if (args.length !== 3) { await sendTelegramMessage("Format: <code>/ongkir BBM-ORDER nominal</code>"); return Response.json({ ok: true }); }
        const order = await db.order.findUnique({ where: { orderNumber: args[1] } });
        if (!order || !canSetShipping(order)) { await sendTelegramMessage("Pesanan tidak ditemukan atau tidak dapat diubah."); return Response.json({ ok: true }); }
        
        const cost = parseInt(args[2]);
        await sendTelegramMessage(`<b>Konfirmasi Ongkir</b>\nOrder: <code>${order.orderNumber}</code>\nBiaya: ${money(cost)}\nTotal: ${money(order.subtotal + cost - order.discount)}`, [[{ text: "✅ Konfirmasi", callback_data: `confirm_ongkir:${order.id}:${cost}` }]]);
    }
    
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[Telegram Webhook] Error:", err);
    return Response.json({ error: "Internal Error" }, { status: 500 });
  }
}
