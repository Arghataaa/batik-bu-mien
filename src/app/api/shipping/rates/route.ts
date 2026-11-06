import { db } from "@/lib/db";
import { adminGuard, apiRun, parseJsonBody } from "@/lib/api-helpers";
import { fetchBiteshipRates } from "@/lib/biteship";

export async function POST(request: Request) {
  return apiRun(async () => {
    // Memastikan hanya admin terautentikasi yang dapat mengecek tarif pengiriman order
    await adminGuard();

    const body = await parseJsonBody<{
      orderId?: string;
      orderNumber?: string;
      couriers?: string;
    }>(request);

    const orderId = body.orderId?.trim();
    const orderNumber = body.orderNumber?.trim();

    if (!orderId && !orderNumber) {
      throw new Error("orderId atau orderNumber wajib diberikan");
    }

    const order = await db.order.findFirst({
      where: {
        OR: [
          ...(orderId ? [{ id: orderId }] : []),
          ...(orderNumber ? [{ orderNumber }] : []),
        ],
      },
      select: {
        id: true,
        orderNumber: true,
        orderStatus: true,
        paymentStatus: true,
        postalCode: true,
        city: true,
        province: true,
        address: true,
        totalWeight: true,
        shippingCost: true,
      },
    });

    if (!order) {
      throw new Error("Pesanan tidak ditemukan");
    }

    if (order.paymentStatus === "PAID") {
      throw new Error("Pesanan ini sudah dibayar, tidak dapat menghitung ulang ongkir");
    }

    const cleanPostal = order.postalCode?.replace(/\D/g, "");
    if (!cleanPostal || cleanPostal.length !== 5) {
      throw new Error("Kode pos tujuan pesanan tidak valid (harus 5 digit angka)");
    }

    const weightInGrams = order.totalWeight && order.totalWeight > 0 ? order.totalWeight : 250;
    const couriers = body.couriers?.trim() || "jne,sicepat,jnt,anteraja";

    const result = await fetchBiteshipRates(cleanPostal, weightInGrams, couriers);

    if (!result.success) {
      throw new Error(result.error || "Gagal mendapatkan tarif pengiriman dari Biteship");
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      destinationPostalCode: cleanPostal,
      totalWeight: weightInGrams,
      currentShippingCost: order.shippingCost,
      rates: result.pricing,
    };
  });
}
