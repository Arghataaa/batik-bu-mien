"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/format";
import { toast } from "sonner";

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  city: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  courier?: string;
  trackingNumber?: string;
  adminNote?: string;
  snapToken?: string;
  items: Array<{ id: string; name: string; quantity: number; price: number }>;
  createdAt: string;
};

export function OrdersSection() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Order>>({});

  useEffect(() => {
    fetch(`/api/admin/orders?search=${search}`)
      .then((r) => r.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      });
  }, [search]);

  async function saveOrder() {
    if (!editingId) return;
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: editingId, ...editData }),
    });
    if (res.ok) {
      toast.success("Pesanan diperbarui");
      setEditingId(null);
      setOrders((prev) =>
        prev.map((o) => (o.id === editingId ? { ...o, ...editData } : o))
      );
    } else {
      toast.error("Gagal memperbarui pesanan");
    }
  }

  async function createPaymentLink(orderId: string) {
    const res = await fetch("/api/admin/orders/create-snap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    if (res.ok) {
      const data = await res.json();
      toast.success("Link pembayaran dibuat");
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, snapToken: data.token } : o
        )
      );
    } else {
      const data = await res.json();
      toast.error(data.error || "Gagal membuat link pembayaran");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Cari nomor pesanan, nama, atau nomor HP"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{order.orderNumber}</h3>
                  <p className="text-sm text-muted-foreground">
                    {order.customerName} • {order.customerPhone}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatRupiah(order.total)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
              </div>

              <div className="bg-secondary/50 p-2 rounded text-sm space-y-1">
                {order.items.map((item) => (
                  <p key={item.id}>
                    {item.name} × {item.quantity} = {formatRupiah(item.price * item.quantity)}
                  </p>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Status Pembayaran</p>
                  <p className="font-medium">{order.paymentStatus}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status Pesanan</p>
                  <p className="font-medium">{order.orderStatus}</p>
                </div>
              </div>

              {editingId === order.id ? (
                <div className="space-y-2 border-t pt-2">
                  <div>
                    <label className="text-sm">Biaya Ongkir</label>
                    <Input
                      type="number"
                      value={editData.shippingCost || 0}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          shippingCost: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm">Status Pesanan</label>
                    <select
                      className="w-full border rounded p-2 text-sm"
                      value={editData.orderStatus || order.orderStatus}
                      onChange={(e) =>
                        setEditData({ ...editData, orderStatus: e.target.value })
                      }
                    >
                      <option value="WAITING_SHIPPING_CONFIRMATION">Menunggu Konfirmasi Ongkir</option>
                      <option value="PROCESSING">Diproses</option>
                      <option value="PACKED">Dikemas</option>
                      <option value="SHIPPED">Dikirim</option>
                      <option value="COMPLETED">Selesai</option>
                      <option value="CANCELLED">Dibatalkan</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm">Kurir</label>
                    <Input
                      placeholder="JNE, Pos, dll"
                      value={editData.courier || ""}
                      onChange={(e) =>
                        setEditData({ ...editData, courier: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm">Nomor Resi</label>
                    <Input
                      placeholder="Nomor resi pengiriman"
                      value={editData.trackingNumber || ""}
                      onChange={(e) =>
                        setEditData({ ...editData, trackingNumber: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveOrder}>
                      Simpan
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(null)}
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  {order.shippingCost > 0 && (
                    <p>Ongkir: {formatRupiah(order.shippingCost)}</p>
                  )}
                  {order.courier && <p>Kurir: {order.courier}</p>}
                  {order.trackingNumber && <p>Resi: {order.trackingNumber}</p>}
                  {order.paymentStatus === "PENDING_SHIPPING" && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setEditingId(order.id);
                        setEditData(order);
                      }}
                    >
                      Edit & Tentukan Ongkir
                    </Button>
                  )}
                  {order.paymentStatus === "PENDING_SHIPPING" &&
                    order.shippingCost > 0 && (
                      <Button
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => createPaymentLink(order.id)}
                      >
                        Buat Link Pembayaran Midtrans
                      </Button>
                    )}
                  {order.paymentStatus !== "PENDING_SHIPPING" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(order.id);
                        setEditData(order);
                      }}
                    >
                      Edit Status
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
