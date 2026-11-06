import { db } from "@/lib/db";

export type BiteshipPricing = {
  courier_name: string;
  courier_code: string;
  service_name: string;
  service_code: string;
  cost: number;
  etd?: string;
};

export type BiteshipRateResponse = {
  success: boolean;
  pricing: BiteshipPricing[];
  error?: string;
};

export async function fetchBiteshipRates(
  orderId: string,
  couriers = "jne,sicepat,jnt,anteraja",
): Promise<BiteshipRateResponse> {
  const apiKey = process.env.BITESHIP_API_KEY;
  const originPostalCode = process.env.BITESHIP_ORIGIN_POSTAL_CODE;

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order || !apiKey || !originPostalCode) {
    return { success: false, pricing: [], error: "Data order atau konfigurasi pengiriman tidak lengkap." };
  }

  const destinationPostalCode = Number(order.postalCode.replace(/\D/g, ""));
  const weight = order.totalWeight;
  const items = order.items.map(item => ({
    name: item.name,
    value: item.price,
    quantity: item.quantity,
    weight: Math.round(item.price > 0 ? (weight / order.items.length) : 0) // Distribusi berat estimasi per item
  }));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20_000);

  try {
    const res = await fetch("https://api.biteship.com/v1/rates/couriers", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        Authorization: `Bearer ${apiKey}` 
      },
      body: JSON.stringify({
        origin_postal_code: Number(originPostalCode),
        destination_postal_code: destinationPostalCode,
        couriers: couriers,
        items: items
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error("[Biteship] HTTP Error:", res.status, errorBody);
      return { success: false, pricing: [], error: `Gagal mengambil tarif (HTTP ${res.status})` };
    }

    const data = await res.json() as { pricing: any[] };
    const pricing = data.pricing.map((p): BiteshipPricing => ({
      courier_name: p.courier_name,
      courier_code: p.courier_code,
      service_name: p.service_name,
      service_code: p.service_code,
      cost: p.price,
      etd: p.duration
    }));

    return { success: true, pricing };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") 
      return { success: false, pricing: [], error: "Koneksi ke layanan pengiriman timeout." };
    return { success: false, pricing: [], error: "Kesalahan internal saat menghitung tarif." };
  } finally {
    clearTimeout(timeoutId);
  }
}
