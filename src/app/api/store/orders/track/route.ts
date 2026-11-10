import { db } from "@/lib/db";
import { apiRun } from "@/lib/api-helpers";

export async function GET(request: Request) {
  return apiRun(async () => {
    const url = new URL(request.url);
    const orderNumber = (url.searchParams.get("orderNumber") || "").trim();

    if (!orderNumber) {
      throw new Error("Nomor pesanan wajib diisi");
    }

    const order = await db.order.findFirst({
      where: {
        orderNumber: {
          equals: orderNumber,
          mode: "insensitive",
        },
      },
      select: {
        trackingToken: true,
      },
    });

    if (!order) {
      return Response.json(
        { error: "Pesanan dengan nomor tersebut tidak ditemukan" },
        { status: 404 }
      );
    }

    return Response.json({ trackingToken: order.trackingToken });
  });
}
