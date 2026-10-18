import { db } from "@/lib/db";
import {
  adminGuard,
  apiRun,
  parseJsonBody,
  userGuard,
} from "@/lib/api-helpers";

/**
 * GET /api/suppliers/:id → Supplier
 * PATCH /api/suppliers/:id { ...fields } → Supplier [ADMIN]
 * DELETE /api/suppliers/:id → { ok: true } [ADMIN]
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return apiRun(async () => {
    await userGuard();
    const { id } = await params;
    const s = await db.supplier.findUnique({ where: { id } });
    if (!s) return Response.json({ error: "Tidak ditemukan" }, { status: 404 });
    return Response.json(s);
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return apiRun(async () => {
    await adminGuard();
    const { id } = await params;
    const body = await parseJsonBody<{
      name?: string;
      contact?: string | null;
      phone?: string | null;
      address?: string | null;
      notes?: string | null;
    }>(request);

    const existing = await db.supplier.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: "Tidak ditemukan" }, { status: 404 });

    const data: Record<string, string | null> = {};
    if (body.name != null) {
      const name = body.name.trim();
      if (!name) throw new Error("Nama supplier wajib diisi");
      data.name = name;
    }
    if (body.contact != null) data.contact = body.contact.trim() || null;
    if (body.phone != null) data.phone = body.phone.trim() || null;
    if (body.address != null) data.address = body.address.trim() || null;
    if (body.notes != null) data.notes = body.notes.trim() || null;

    const s = await db.supplier.update({ where: { id }, data });
    return Response.json(s);
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return apiRun(async () => {
    await adminGuard();
    const { id } = await params;
    const s = await db.supplier.findUnique({
      where: { id },
      include: { _count: { select: { stockMovements: true } } },
    });
    if (!s) return Response.json({ error: "Tidak ditemukan" }, { status: 404 });
    // Soft-prevent: supplier with movements stays but is deletable if no movements
    if (s._count.stockMovements > 0) {
      return Response.json(
        { error: "Supplier masih memiliki riwayat pergerakan stok." },
        { status: 400 },
      );
    }
    await db.supplier.delete({ where: { id } });
    return Response.json({ ok: true });
  });
}
