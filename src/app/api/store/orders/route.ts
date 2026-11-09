import { db } from "@/lib/db";
import { apiRun, parseJsonBody } from "@/lib/api-helpers";
import MidtransClient from "midtrans-client";

type CheckoutItem = { productId: string; variantId: string; quantity: number; price?: number; name?: string; sku?: string; variantLabel?: string };
type CheckoutInput = { customerName?: string; customerPhone?: string; customerEmail?: string; province?: string; city?: string; district?: string; village?: string; postalCode?: string; address?: string; note?: string; items?: CheckoutItem[] };

export async function POST(request: Request) {
  return apiRun(async () => {
    const body = await parseJsonBody<CheckoutInput>(request);
    const required = ["customerName","customerPhone","customerEmail","province","city","district","village","postalCode","address"] as const;
    for (const key of required) if (!String(body[key] || "").trim()) throw new Error("Data penerima belum lengkap");
    if (!/^\S+@\S+\.\S+$/.test(String(body.customerEmail))) throw new Error("Email tidak valid");
    if (!/^[0-9+]{10,16}$/.test(String(body.customerPhone).replace(/\s/g, ""))) throw new Error("Nomor WhatsApp tidak valid");
    const requested = Array.isArray(body.items) ? body.items : [];
    if (!requested.length) throw new Error("Keranjang kosong");
    const order = await db.$transaction(async (tx) => {
      const items: Array<{ productId: string; variantId: string; name: string; sku: string; variantLabel: string; price: number; quantity: number; subtotal: number }> = [];
      let totalWeightItems = 0;
      for (const item of requested) {
        let variant = await tx.productVariant.findUnique({ where: { id: item.variantId }, include: { product: true } });
        
        // Fallback untuk sample items dari landing catalog
        if (!variant && item.variantId.startsWith("sample-")) {
          const itemPrice = typeof item.price === "number" && item.price > 0 ? item.price : 285000;
          const itemName = item.name || "Kemeja Batik Kawung — Cokelat";
          const itemSku = item.sku || "SAMPLE-SKU";
          const itemLabel = item.variantLabel || "Standard";
          const itemWeight = 250;

          items.push({
            productId: item.productId,
            variantId: item.variantId,
            name: itemName,
            sku: itemSku,
            variantLabel: itemLabel,
            price: itemPrice,
            quantity: item.quantity,
            subtotal: itemPrice * item.quantity,
          });
          totalWeightItems += itemWeight * item.quantity;
          continue;
        }

        if (!variant || !variant.product?.active) throw new Error("Produk tidak tersedia");
        if (!Number.isInteger(item.quantity) || item.quantity < 1) throw new Error("Jumlah produk tidak valid");
        if (variant.stock > 0 && variant.stock < item.quantity) throw new Error(`Stok ${variant.product.name} tidak cukup`);
        
        const effectiveWeight = variant.weight > 0 ? variant.weight : (variant.product.weight > 0 ? variant.product.weight : 250);

        items.push({
          productId: variant.productId,
          variantId: variant.id,
          name: variant.product.name,
          sku: variant.sku,
          variantLabel: [variant.size, variant.color, variant.motif].filter(Boolean).join(" / ") || "Standar",
          price: variant.product.price,
          quantity: item.quantity,
          subtotal: variant.product.price * item.quantity,
        });
        totalWeightItems += effectiveWeight * item.quantity;
      }
      const PACKING_WEIGHT = 100; // Konfigurasi berat kemasan (gram)
      const totalWeight = totalWeightItems + PACKING_WEIGHT;
      const subtotal = items.reduce((n, i) => n + i.subtotal, 0);
      const shippingCost = body.shippingCost || 0;
      const shippingZone = body.shippingZone || undefined;
      const total = subtotal + shippingCost - (body.discount || 0);
      const created = await tx.order.create({ data: { orderNumber: `BBM-${Date.now()}`, customerName: body.customerName!.trim(), customerPhone: body.customerPhone!.trim(), customerEmail: body.customerEmail!.trim().toLowerCase(), province: body.province!.trim(), city: body.city!.trim(), district: body.district!.trim(), village: body.village!.trim(), postalCode: body.postalCode!.trim(), address: body.address!.trim(), note: body.note?.trim() || null, subtotal, shippingCost, shippingZone, discount: body.discount || 0, total, totalWeight, paymentMethod: "CASH", paymentStatus: "PENDING_PAYMENT", orderStatus: "WAITING_PAYMENT", items: { create: items }, statusHistory: { create: { status: "WAITING_PAYMENT", note: "Pesanan diterima. Menunggu pembayaran." } } } });
      return created;
    }, { maxWait: 15000, timeout: 30000 });



    // Generate Midtrans Snap token jika Midtrans dikonfigurasi
    let snapToken: string | null = null;
    let paymentOrderId: string | null = null;
    if (process.env.MIDTRANS_SERVER_KEY) {
      try {
        const snap = new MidtransClient.Snap({
          isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
          serverKey: process.env.MIDTRANS_SERVER_KEY,
          clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "",
        });

        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const itemDetails = [
          ...order.items.map((item) => ({
            id: item.id,
            price: item.price,
            quantity: item.quantity,
            name: item.name.slice(0, 50),
          })),
        ];

        if (order.shippingCost > 0) {
          itemDetails.push({
            id: "SHIPPING",
            price: order.shippingCost,
            quantity: 1,
            name: "Ongkos Kirim",
          });
        }

        const transaction = await snap.createTransaction({
          transaction_details: {
            order_id: order.orderNumber,
            gross_amount: order.total,
          },
          item_details: itemDetails,
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
            finish: `${baseUrl}/pesanan/${order.trackingToken}`,
            error: `${baseUrl}/pesanan/${order.trackingToken}`,
            pending: `${baseUrl}/pesanan/${order.trackingToken}`,
          },
        });

        snapToken = transaction.token;
        paymentOrderId = transaction.redirect_url?.split("order_id=")[1]?.split("&")[0] || null;

        await db.order.update({
          where: { id: order.id },
          data: { snapToken, paymentOrderId },
        });
      } catch (err) {
        console.error("Gagal create snap transaction:", err);
      }
    }

    return Response.json({ orderNumber: order.orderNumber, trackingToken: order.trackingToken });
  });
}
