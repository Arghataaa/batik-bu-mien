import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/format";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingFooter } from "@/components/landing/landing-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Package, CreditCard, Clock, CheckCircle2, Phone } from "lucide-react";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await db.order.findUnique({
    where: { trackingToken: token },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });

  const storeInfo = await db.shippingSetting.findUnique({
    where: { id: "default" },
  });

  if (!order)
    return (
      <div className="min-h-screen flex flex-col">
        <LandingNavbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center p-8">
            <h1 className="text-xl font-bold">Pesanan tidak ditemukan</h1>
          </Card>
        </main>
        <LandingFooter />
      </div>
    );

  const productIds = Array.from(new Set(order.items.map((i) => i.productId)));
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, imageUrl: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p.imageUrl]));

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(date) + " WIB";

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf6ee]">
      <LandingNavbar />
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#392719]">Detail Pesanan</h1>
            <p className="text-sm text-muted-foreground">{order.orderNumber}</p>
          </div>
          <Badge variant="outline" className="border-[#a7683d] text-[#a7683d]">
            {order.orderStatus.replace(/_/g, " ")}
          </Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Package className="w-5 h-5 text-[#a7683d]" />
                <CardTitle>Produk Pesanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <img
                      src={productMap.get(item.productId) || "/landing/kemeja-batik.png"}
                      alt={item.name}
                      className="h-16 w-16 object-cover rounded-lg border border-[#eee1d2] bg-[#fbf6ee]"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-[#392719]">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.variantLabel || "Standard"}</p>
                      <div className="flex justify-between mt-1 text-sm">
                        <span className="text-muted-foreground">{item.quantity} x {formatRupiah(item.price)}</span>
                        <span className="font-semibold text-[#4a3020]">{formatRupiah(item.subtotal)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <MapPin className="w-5 h-5 text-[#a7683d]" />
                <CardTitle>Pengiriman</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p className="font-medium">{order.customerName}</p>
                <p className="text-muted-foreground">{order.address}</p>
                <p className="text-muted-foreground">{order.city}, {order.postalCode}</p>
                <p className="text-muted-foreground">{order.customerPhone}</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#a7683d]" />
                <CardTitle>Pembayaran</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatRupiah(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ongkir</span>
                  <span>{order.shippingZone ? formatRupiah(order.shippingCost) : "-"}</span>
                </div>
                {order.shippingZone && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Zona:</span>
                    <span>{order.shippingZone}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-[#392719]">
                  <span>Total</span>
                  <span>{formatRupiah(order.total)}</span>
                </div>
                <div className="pt-4">
                  <div className="mb-3 rounded-lg bg-[#fbf6ee] p-3 text-xs text-[#775333]">
                    <p className="font-medium">Cara Pembayaran:</p>
                    <p className="mt-1">
                      Transfer ke Rekening: <span className="font-semibold">BCA a.n. Batik Bu Mien</span> atau gunakan QRIS
                    </p>
                  </div>
                  <a
                    href={`https://wa.me/6285156468910?text=${encodeURIComponent(`Halo, saya ingin konfirmasi pembayaran order ${order.orderNumber}.\n\nTotal yang harus dibayar: ${formatRupiah(order.total)}\n\nSaya sudah melakukan transfer.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 font-semibold text-white hover:bg-[#20bd5a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
                  >
                    <Phone className="h-4 w-4" />
                    Konfirmasi via WhatsApp
                  </a>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Tombol di atas akan membuka WhatsApp dengan pesan otomatis
                  </p>
                </div>
              </CardContent>
            </Card>
              <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Clock className="w-5 h-5 text-[#a7683d]" />
                <CardTitle>Timeline Pesanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  "WAITING_SHIPPING_CONFIRMATION",
                  "WAITING_PAYMENT",
                  "PROCESSING",
                  "PACKED",
                  "SHIPPED",
                  "COMPLETED",
                ].map((status, idx) => {
                  const history = order.statusHistory.find((h) => h.status === status);
                  const completed = history || (order.orderStatus === status);

                  const statusLabel = {
                    WAITING_SHIPPING_CONFIRMATION: "Pesanan Dibuat",
                    WAITING_PAYMENT: "Menunggu Pembayaran",
                    PROCESSING: "Pesanan Diproses",
                    PACKED: "Pesanan Dikemas",
                    SHIPPED: "Pesanan Dikirim",
                    COMPLETED: "Tiba/Selesai",
                  }[status];

                  return (
                    <div key={status} className="flex gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${completed ? "bg-green-600 text-white" : "bg-gray-200"}`}>
                        {completed ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${completed ? "text-foreground" : "text-muted-foreground"}`}>
                          {statusLabel}
                        </p>
                        {history && (
                          <p className="text-xs text-muted-foreground">
                            {formatDate(new Date(history.createdAt))}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>

  );
}

