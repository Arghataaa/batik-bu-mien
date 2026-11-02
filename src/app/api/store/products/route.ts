import { db } from "@/lib/db";
import { apiRun } from "@/lib/api-helpers";

export async function GET() {
  return apiRun(async () => {
    const products = await db.product.findMany({
      where: { active: true },
      include: {
        category: true,
        variants: {
          where: { stock: { gt: 0 } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return Response.json(products);
  });
}
