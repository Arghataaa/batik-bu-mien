import { db } from "@/lib/db";
import { apiRun } from "@/lib/api-helpers";

export async function GET() {
  return apiRun(async () => {
    const products = await db.product.findMany({
      where: { active: true },
      include: {
        category: true,
        variants: true,
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const categoryImageMap: Record<string, string> = {
      "kemeja": "/landing/kemeja.jpeg",
      "daster": "/landing/daster.jpeg",
      "sarung": "/landing/sarung.jpeg",
      "sorban": "/landing/sorban.jpeg",
      "blangkon": "/landing/blangkon.jpeg",
      "selop": "/landing/selop.jpeg",
    };

    const enhanced = products.map((p) => {
      let img = p.imageUrl;
      if (!img) {
        const catName = p.category?.name?.toLowerCase() || "";
        for (const [key, val] of Object.entries(categoryImageMap)) {
          if (catName.includes(key)) {
            img = val;
            break;
          }
        }
        if (!img) img = "/landing/kemeja.jpeg";
      }
      return {
        ...p,
        imageUrl: img,
      };
    });

    return Response.json(enhanced);
  });
}
