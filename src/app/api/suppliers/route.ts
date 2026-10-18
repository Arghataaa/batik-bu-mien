import { db } from "@/lib/db";
import { adminGuard, apiRun, parseJsonBody, userGuard } from "@/lib/api-helpers";

/**
 * GET /api/suppliers → Supplier[]
 * POST /api/suppliers { name, contact?, phone?, address?, notes? } → Supplier [ADMIN]
 */
export async function GET() {
  return apiRun(async () => {
    await userGuard();
    const list = await db.supplier.findMany({
      orderBy: { name: "asc" },
    });
    return Response.json(list);
  });
}

export async function POST(request: Request) {
  return apiRun(async () => {
    await adminGuard();
    const body = await parseJsonBody<{
      name?: string;
      contact?: string | null;
      phone?: string | null;
      address?: string | null;
      notes?: string | null;
    }>(request);

    const name = (body.name || "").trim();
    if (!name) throw new Error("Nama supplier wajib diisi");

    const s = await db.supplier.create({
      data: {
        name,
        contact: body.contact?.trim() || null,
        phone: body.phone?.trim() || null,
        address: body.address?.trim() || null,
        notes: body.notes?.trim() || null,
      },
    });
    return Response.json(s, { status: 201 });
  });
}
