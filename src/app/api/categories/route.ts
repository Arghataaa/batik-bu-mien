import { db } from "@/lib/db";
import { adminGuard, apiRun, parseJsonBody, userGuard } from "@/lib/api-helpers";
import { slugify } from "@/lib/format";

/**
 * GET /api/categories → Category[] (with _count.products)
 * POST /api/categories { name, description? } → Category [ADMIN]
 */
export async function GET() {
  return apiRun(async () => {
    await userGuard();
    const list = await db.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return Response.json(list);
  });
}

export async function POST(request: Request) {
  return apiRun(async () => {
    await adminGuard();
    const body = await parseJsonBody<{
      name?: string;
      description?: string | null;
    }>(request);

    const name = (body.name || "").trim();
    if (!name) throw new Error("Nama kategori wajib diisi");

    // Generate unique slug
    const base = slugify(name) || `cat-${Date.now()}`;
    let slug = base;
    let n = 2;
    while (await db.category.findUnique({ where: { slug } })) {
      slug = `${base}-${n++}`;
    }

    const cat = await db.category.create({
      data: {
        name,
        slug,
        description: body.description?.trim() || null,
      },
      include: { _count: { select: { products: true } } },
    });
    return Response.json(cat, { status: 201 });
  });
}
