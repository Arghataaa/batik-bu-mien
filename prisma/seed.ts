import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const rupiah = (n: number) => n; // store as integer rupiah

async function main() {
  console.log("🧹 Cleaning existing data...");
  await db.saleItem.deleteMany();
  await db.sale.deleteMany();
  await db.stockMovement.deleteMany();
  await db.productVariant.deleteMany();
  await db.product.deleteMany();
  await db.supplier.deleteMany();
  await db.category.deleteMany();
  await db.user.deleteMany();

  // ---- Users ----
  const adminPass = await bcrypt.hash("admin123", 10);
  const kasirPass = await bcrypt.hash("kasir123", 10);
  const admin = await db.user.create({
    data: { email: "admin@batikbumien.test", name: "Bu Mien", passwordHash: adminPass, role: "ADMIN" },
  });
  const kasir = await db.user.create({
    data: { email: "kasir@batikbumien.test", name: "Kasir Toko", passwordHash: kasirPass, role: "KASIR" },
  });
  console.log("✓ Users created (admin@batikbumien.test / admin123, kasir@batikbumien.test / kasir123)");

  // ---- Categories ----
  const cats = [
    { name: "Kemeja Batik", slug: "kemeja-batik", description: "Kemeja batik siap pakai pria & wanita" },
    { name: "Daster Batik", slug: "daster-batik", description: "Daster batik rumahan nyaman" },
    { name: "Sarung", slug: "sarung", description: "Sarung batik motif tradisional" },
    { name: "Sorban", slug: "sorban", description: "Sorban batik tulis premium" },
    { name: "Blangkon", slug: "blangkon", description: "Blangkon Yogya & Solo" },
    { name: "Produk Batik Lainnya", slug: "lainnya", description: "Aksesori & fashion batik lainnya" },
  ];
  const catMap: Record<string, string> = {};
  for (const c of cats) {
    const rec = await db.category.create({ data: c });
    catMap[c.slug] = rec.id;
  }
  console.log("✓ Categories created (6)");

  // ---- Suppliers ----
  const suppliers = [
    { name: "Konveksi Batik Makmur", contact: "Pak Surya", phone: "0812-3456-7890", address: "Solo, Jawa Tengah" },
    { name: "UD. Batik Tulis Asli", contact: "Bu Rina", phone: "0813-1111-2222", address: "Yogyakarta" },
    { name: "Pabrik Sarung Kita", contact: "Pak Hadi", phone: "0857-9999-0000", address: "Pekalongan" },
  ];
  const supMap: Record<number, string> = {};
  for (let i = 0; i < suppliers.length; i++) {
    const rec = await db.supplier.create({ data: suppliers[i] });
    supMap[i] = rec.id;
  }
  console.log("✓ Suppliers created (3)");

  // ---- Products with variants ----
  // Each product: { name, sku, categorySlug, price, cost, hasVariants, lowStockThreshold, variants: [{size,color,motif,stock}], imageUrl }
  type V = { sku: string; size?: string; color?: string; motif?: string; stock: number };
  type P = {
    name: string;
    sku: string;
    categorySlug: string;
    price: number;
    cost: number;
    hasVariants: boolean;
    lowStockThreshold: number;
    imageUrl?: string;
    variants: V[];
  };

  const products: P[] = [
    {
      name: "Kemeja Batik Pria Lengan Panjang",
      sku: "KMS-001",
      categorySlug: "kemeja-batik",
      price: rupiah(185000),
      cost: rupiah(110000),
      hasVariants: true,
      lowStockThreshold: 5,
      variants: [
        { sku: "KMS-001-M-KW", size: "M", color: "Cokelat", motif: "Kawung", stock: 18 },
        { sku: "KMS-001-L-KW", size: "L", color: "Cokelat", motif: "Kawung", stock: 12 },
        { sku: "KMS-001-XL-PR", size: "XL", color: "Tua", motif: "Parang", stock: 3 },
        { sku: "KMS-001-M-PR", size: "M", color: "Hitam", motif: "Parang", stock: 9 },
      ],
    },
    {
      name: "Kemeja Batik Wanita Modern",
      sku: "KMS-002",
      categorySlug: "kemeja-batik",
      price: rupiah(165000),
      cost: rupiah(95000),
      hasVariants: true,
      lowStockThreshold: 5,
      variants: [
        { sku: "KMS-002-S-MG", size: "S", color: "Krem", motif: "Mega Mendung", stock: 14 },
        { sku: "KMS-002-M-MG", size: "M", color: "Krem", motif: "Mega Mendung", stock: 7 },
        { sku: "KMS-002-L-TB", size: "L", color: "Terracotta", motif: "Truntum", stock: 2 },
      ],
    },
    {
      name: "Daster Batik Rumahan",
      sku: "DST-001",  
      categorySlug: "daster-batik",
      price: rupiah(85000),
      cost: rupiah(48000),
      hasVariants: true,
      lowStockThreshold: 8,
      variants: [
        { sku: "DST-001-M-SR", size: "M", color: "Cokelat Susu", motif: "Sidomukti", stock: 25 },
        { sku: "DST-001-L-SR", size: "L", color: "Cokelat Susu", motif: "Sidomukti", stock: 16 },
        { sku: "DST-001-XL-SR", size: "XL", color: "Cokelat Susu", motif: "Sidomukti", stock: 4 },
        { sku: "DST-001-M-LT", size: "M", color: "Hijau Tua", motif: "Lereng", stock: 1 },
      ],
    },
    {
      name: "Daster Batik Premium",
      sku: "DST-002",
      categorySlug: "daster-batik",
      price: rupiah(120000),
      cost: rupiah(70000),
      hasVariants: false,
      lowStockThreshold: 6,
      variants: [{ sku: "DST-002-DEF", stock: 11 }],
    },
    {
      name: "Sarung Batik Motif Tangan",
      sku: "SRG-001",
      categorySlug: "sarung",
      price: rupiah(135000),
      cost: rupiah(78000),
      hasVariants: true,
      lowStockThreshold: 6,
      variants: [
        { sku: "SRG-001-PR-TB", motif: "Parang", color: "Tua", stock: 20 },
        { sku: "SRG-001-KW-CR", motif: "Kawung", color: "Cokelat", stock: 13 },
        { sku: "SRG-001-SM-TC", motif: "Sidomukti", color: "Terracotta", stock: 3 },
      ],
    },
    {
      name: "Sarung Batik Klasik Premium",
      sku: "SRG-002",
      categorySlug: "sarung",
      price: rupiah(195000),
      cost: rupiah(120000),
      hasVariants: false,
      lowStockThreshold: 4,
      variants: [{ sku: "SRG-002-DEF", stock: 8 }],
    },
    {
      name: "Sorban Batik Tulis",
      sku: "SRB-001",
      categorySlug: "sorban",
      price: rupiah(75000),
      cost: rupiah(42000),
      hasVariants: true,
      lowStockThreshold: 10,
      variants: [
        { sku: "SRB-001-MG", motif: "Mega Mendung", color: "Krem", stock: 30 },
        { sku: "SRB-001-PR", motif: "Parang", color: "Cokelat", stock: 5 },
        { sku: "SRB-001-KW", motif: "Kawung", color: "Hitam", stock: 2 },
      ],
    },
    {
      name: "Blangkon Yogya Gajahan",
      sku: "BLK-001",
      categorySlug: "blangkon",
      price: rupiah(95000),
      cost: rupiah(55000),
      hasVariants: true,
      lowStockThreshold: 4,
      variants: [
        { sku: "BLK-001-S", size: "S", motif: "Gajah Mada", stock: 10 },
        { sku: "BLK-001-M", size: "M", motif: "Gajah Mada", stock: 6 },
        { sku: "BLK-001-L", size: "L", motif: "Gajah Mada", stock: 1 },
      ],
    },
    {
      name: "Blangkon Solo Liris",
      sku: "BLK-002",
      categorySlug: "blangkon",
      price: rupiah(110000),
      cost: rupiah(65000),
      hasVariants: false,
      lowStockThreshold: 3,
      variants: [{ sku: "BLK-002-DEF", stock: 4 }],
    },
    {
      name: "Brokat Batik Aksesori",
      sku: "AKS-001",
      categorySlug: "lainnya",
      price: rupiah(45000),
      cost: rupiah(22000),
      hasVariants: false,
      lowStockThreshold: 12,
      variants: [{ sku: "AKS-001-DEF", stock: 22 }],
    },
    {
      name: "Masker Batik Premium",
      sku: "AKS-002",
      categorySlug: "lainnya",
      price: rupiah(25000),
      cost: rupiah(12000),
      hasVariants: true,
      lowStockThreshold: 15,
      variants: [
        { sku: "AKS-002-MG", motif: "Mega Mendung", color: "Krem", stock: 40 },
        { sku: "AKS-002-KW", motif: "Kawung", color: "Cokelat", stock: 28 },
      ],
    },
  ];

  const productIds: { id: string; variants: { id: string; stock: number; price: number; cost: number; name: string; sku: string; variantLabel: string }[] }[] = [];
  for (const p of products) {
    const product = await db.product.create({
      data: {
        name: p.name,
        sku: p.sku,
        categoryId: catMap[p.categorySlug],
        price: p.price,
        cost: p.cost,
        hasVariants: p.hasVariants,
        lowStockThreshold: p.lowStockThreshold,
        imageUrl: p.imageUrl ?? null,
        active: true,
      },
    });
    const variantIds: any[] = [];
    for (const v of p.variants) {
      const vt = await db.productVariant.create({
        data: {
          productId: product.id,
          sku: v.sku,
          size: v.size ?? null,
          color: v.color ?? null,
          motif: v.motif ?? null,
          stock: v.stock,
        },
      });
      // initial stock-in movement
      await db.stockMovement.create({
        data: {
          productId: product.id,
          variantId: vt.id,
          type: "IN",
          quantity: v.stock,
          reason: "Stok awal",
          supplierId: supMap[Math.floor(Math.random() * 3)],
          userId: admin.id,
        },
      });
      const variantLabel = [v.size, v.color, v.motif].filter(Boolean).join(" / ") || null;
      variantIds.push({ id: vt.id, stock: v.stock, price: p.price, cost: p.cost ?? 0, name: p.name, sku: v.sku, variantLabel });
    }
    productIds.push({ id: product.id, variants: variantIds });
  }
  console.log(`✓ Products created (${products.length}) with variants`);

  // ---- Historical sales (last 30 days) for dashboard + insights ----
  // Track remaining stock per variant so we never drive stock negative.
  const remaining = new Map<string, number>();
  for (const p of productIds) for (const v of p.variants) remaining.set(v.id, v.stock);

  const now = new Date();
  let invoiceCounter = 1000;
  const totalSales = 42;
  for (let i = 0; i < totalSales; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    createdAt.setHours(9 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 60), 0, 0);

    // 1-3 items per sale
    const itemCount = 1 + Math.floor(Math.random() * 3);
    const usedProducts = new Set<string>();
    const items: { productId: string; variantId: string; name: string; sku: string; variantLabel: string; price: number; cost: number; qty: number; subtotal: number }[] = [];
    for (let j = 0; j < itemCount; j++) {
      const pIdx = Math.floor(Math.random() * productIds.length);
      if (usedProducts.has(pIdx + "")) continue;
      usedProducts.add(pIdx + "");
      const p = productIds[pIdx];
      // Only consider variants that still have stock available
      const available = p.variants.filter((v) => (remaining.get(v.id) ?? 0) > 0);
      if (available.length === 0) continue;
      const v = available[Math.floor(Math.random() * available.length)];
      const maxQty = remaining.get(v.id) ?? 0;
      const qty = Math.min(1 + Math.floor(Math.random() * 2), maxQty);
      if (qty <= 0) continue;
      remaining.set(v.id, maxQty - qty);
      items.push({
        productId: p.id,
        variantId: v.id,
        name: v.name,
        sku: v.sku,
        variantLabel: v.variantLabel ?? "",
        price: v.price,
        cost: v.cost,
        qty,
        subtotal: v.price * qty,
      });
    }
    if (items.length === 0) continue;
    const total = items.reduce((s, it) => s + it.subtotal, 0);
    const totalCost = items.reduce((s, it) => s + it.cost * it.qty, 0);
    const totalProfit = total - totalCost;
    const paid = Math.ceil(total / 5000) * 5000; // round up
    const methods = ["CASH", "QRIS", "DEBIT"];
    const paymentMethod = methods[Math.floor(Math.random() * methods.length)];

    invoiceCounter++;
    const sale = await db.sale.create({
      data: {
        invoiceNo: `INV-${createdAt.getFullYear()}${String(createdAt.getMonth() + 1).padStart(2, "0")}-${invoiceCounter}`,
        total,
        totalCost,
        totalProfit,
        paymentMethod,
        paidAmount: paid,
        changeAmount: paid - total,
        userId: Math.random() > 0.5 ? admin.id : kasir.id,
        createdAt,
      },
    });
    await db.saleItem.createMany({
      data: items.map((it) => ({
        saleId: sale.id,
        productId: it.productId,
        variantId: it.variantId,
        name: it.name,
        sku: it.sku,
        variantLabel: it.variantLabel,
        price: it.price,
        cost: it.cost,
        quantity: it.qty,
        subtotal: it.subtotal,
      })),
    });
    // stock out movements
    for (const it of items) {
      await db.productVariant.update({ where: { id: it.variantId }, data: { stock: { decrement: it.qty } } });
      await db.stockMovement.create({
        data: {
          productId: it.productId,
          variantId: it.variantId,
          type: "OUT",
          quantity: -it.qty,
          reason: "Penjualan",
          saleId: sale.id,
          userId: sale.userId,
          createdAt,
        },
      });
    }
  }
  console.log(`✓ Historical sales created (${totalSales})`);

  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
