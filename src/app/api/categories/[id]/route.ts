import { db } from "@/lib/db";
import {
  adminGuard,
  apiRun,
  parseJsonBody,
  userGuard,
} from "@/lib/api-helpers";
import { slugify } from "@/lib/format";

/**
 * PATCH /api/categories/:id { name?, description? } → Category [ADMIN]
 * DELETE /api/categories/:id → { ok: true } [ADMIN]; 400 if products exist.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return apiRun(async () => {
    await userGuard();
    const { id } = await params;
    const cat = await db.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!cat) return Response.json({ error: "Tidak ditemukan" }, { status: 404 });
    return Response.json(cat);
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
      description?: string | null;
    }>(request);

    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: "Tidak ditemukan" }, { status: 404 });

    const name = body.name != null ? body.name.trim() : existing.name;
    if (!name) throw new Error("Nama kategori wajib diisi");

    // Re-slug only if name changed
    let slug = existing.slug;
    if (name !== existing.name) {
      const base = slugify(name) || `cat-${Date.now()}`;
      slug = base;
      let n = 2;
      while (
        await db.category.findFirst({
          where: { slug, NOT: { id } },
        })
      ) {
        slug = `${base}-${n++}`;
      }
    }

    const cat = await db.category.update({
      where: { id },
      data: {
        name,
        slug,
        description:
          body.description != null
            ? body.description.trim() || null
            : existing.description,
      },
      include: { _count: { select: { products: true } } },
    });
    return Response.json(cat);
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return apiRun(async () => {
    await adminGuard();
    const { id } = await params;
    const cat = await db.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!cat) return Response.json({ error: "Tidak ditemukan" }, { status: 404 });
    if (cat._count.products > 0) {
      return Response.json(
        { error: "Kategori masih memiliki produk. Hapus atau pindahkan produk terlebih dahulu." },
        { status: 400 },
      );
    }
    await db.category.delete({ where: { id } });
    return Response.json({ ok: true });
  });
}
