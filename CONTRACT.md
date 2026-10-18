# Batik Bu Mien — API & Frontend Contract

Single user-visible route: `/` (SPA with client-side view switching via Zustand).
Auth: NextAuth v4 (Credentials, JWT). Session exposes `user.id`, `user.name`, `user.role`.
Roles: `ADMIN` (full access), `KASIR` (POS + dashboard read).
All money in integer Rupiah. Dates ISO strings.

## SPA navigation
- Zustand store `useUIStore` (in `src/lib/ui-store.ts`):
  - `view: "landing" | "admin"`
  - `adminSection: "dashboard" | "catalog" | "inventory" | "pos" | "reports" | "insights"`
  - `setView(v)`, `setSection(s)`
- Auth: `useSession()` from next-auth/react. Unauthenticated → landing + login dialog. Authenticated → admin shell with sidebar.
- Landing "Masuk" / "Admin" button → opens login dialog (credentials). On success → `setView("admin")` + `setSection("dashboard")`.
- Admin sidebar items: Dashboard, Katalog, Inventory, POS Kasir, Laporan, Insights, Keluar (logout → signOut + setView("landing")).
- Admin pages should call APIs with TanStack Query.

## Type definitions
Shared types in `src/lib/types.ts`:
```ts
export type Category = { id:string; name:string; slug:string; description?:string|null; createdAt:string; _count?:{products:number} }
export type Supplier = { id:string; name:string; contact?:string|null; phone?:string|null; address?:string|null; notes?:string|null; createdAt:string }
export type ProductVariant = { id:string; productId:string; sku:string; size?:string|null; color?:string|null; motif?:string|null; stock:number; createdAt:string; updatedAt:string }
export type Product = {
  id:string; name:string; sku:string; categoryId:string; category?:Category;
  description?:string|null; imageUrl?:string|null; price:number; cost?:number|null;
  active:boolean; lowStockThreshold:number; hasVariants:boolean;
  variants:ProductVariant[]; createdAt:string; updatedAt:string;
  totalStock?:number // computed: sum of variants stock
}
export type StockMovement = {
  id:string; productId:string; variantId?:string|null; type:"IN"|"OUT"|"ADJUST";
  quantity:number; reason?:string|null; supplierId?:string|null; supplier?:Supplier|null;
  saleId?:string|null; userId?:string|null; createdAt:string;
  product?:{id:string;name:string;sku:string}; variant?:{id:string;sku:string;size?:string|null;color?:string|null;motif?:string|null}|null;
}
export type SaleItem = {
  id:string; saleId:string; productId:string; variantId?:string|null;
  name:string; sku:string; variantLabel?:string|null; price:number; cost:number;
  quantity:number; subtotal:number;
}
export type Sale = {
  id:string; invoiceNo:string; total:number; totalCost:number; totalProfit:number;
  paymentMethod:string; paidAmount:number; changeAmount:number;
  userId?:string|null; customerName?:string|null; note?:string|null;
  createdAt:string; items:SaleItem[];
}
export type SummaryReport = {
  omzet:number; profit:number; totalCost:number; txCount:number; avgPerTx:number;
  stockInUnits:number; stockOutUnits:number; stockInValue:number; stockOutValue:number;
  cogsSold:number;
}
export type TopProduct = { productId:string; name:string; sku:string; qty:number; revenue:number; profit:number }
export type TopCategory = { categoryId:string; name:string; qty:number; revenue:number; profit:number }
export type SalesTrendPoint = { label:string; revenue:number; profit:number; txCount:number }
export type LowStockItem = { productId:string; name:string; sku:string; variantId?:string|null; variantLabel?:string|null; stock:number; lowStockThreshold:number }
export type StockFlow = { inUnits:number; outUnits:number; adjustUnits:number; inValue:number; outValue:number }
export type InsightReport = {
  insufficientData:boolean; message?:string;
  restock: { productId:string; name:string; variantId?:string|null; variantLabel?:string|null; stock:number; lowStockThreshold:number; velocity30d:number; recommendation:string }[];
  topSellers: { productId:string; name:string; sku:string; qty:number; revenue:number; profit:number }[];
  declining: { productId:string; name:string; sku:string; prevQty:number; lastQty:number; changePct:number }[];
}
```

## API Endpoints (all under /api/, return JSON)

### Auth (NextAuth default)
- `POST /api/auth/callback/credentials`, `GET /api/auth/*` — handled by NextAuth route `src/app/api/auth/[...nextauth]/route.ts`.
- `GET /api/auth/session` — default.

### Categories — `/api/categories`
- `GET` → `Category[]` (with `_count.products`)
- `POST { name, description? }` → `Category` (slug auto from name) [ADMIN]
- `PATCH /:id { name?, description? }` → `Category` [ADMIN]
- `DELETE /:id` → `{ ok: true }` [ADMIN]; 400 if products exist.

### Suppliers — `/api/suppliers`
- `GET` → `Supplier[]`
- `POST { name, contact?, phone?, address?, notes? }` → `Supplier` [ADMIN]
- `PATCH /:id` → `Supplier` [ADMIN]
- `DELETE /:id` → `{ ok: true }` [ADMIN]

### Products — `/api/products`
- `GET ?search=&categoryId=&active=` → `Product[]` (include category + variants + computed `totalStock`)
- `GET /:id` → `Product` (full, include variants)
- `POST { name, sku, categoryId, description?, imageUrl?, price, cost?, active?, lowStockThreshold?, hasVariants, variants:[{sku,size?,color?,motif?,stock}] }` → `Product` [ADMIN]
  - If `hasVariants=false`, ensure exactly one variant (the "default" with null size/color/motif). SKU required.
- `PATCH /:id { ...fields, variants? }` → `Product` [ADMIN]. Variants update merges by id (existing), adds new (no id), removes missing.
- `DELETE /:id` → `{ ok:true }` [ADMIN]; 400 if has sales referencing it (use soft: set active=false if sales exist). Return 200 with active=false in that case.

### Stock — `/api/stock`
- `GET ?productId=&variantId=&type=&from=&to=&limit=` → `StockMovement[]` (include product {id,name,sku}, variant {id,sku,size,color,motif}, supplier)
- `POST { productId, variantId?, type:"IN"|"OUT"|"ADJUST", quantity?, newStock?, reason?, supplierId? }` → `StockMovement` [ADMIN]
  - `IN`: `quantity>0`, stock += quantity
  - `OUT`: `quantity>0`, stock -= quantity, stored quantity = -quantity. 400 if insufficient stock.
  - `ADJUST`: uses `newStock` (absolute), delta = newStock - current; stored quantity = delta.
  - Validate variant belongs to product if variantId given.

### Stock alerts — `/api/stock/alerts`
- `GET` → `LowStockItem[]` (variants where stock <= product.lowStockThreshold, product active)

### Sales — `/api/sales`
- `GET ?from=&to=&limit=50` → `Sale[]` (include items)
- `GET /:id` → `Sale` (with items)
- `POST { items:[{productId, variantId, quantity}], paymentMethod:"CASH"|"QRIS"|"DEBIT"|"TRANSFER", paidAmount, customerName?, note? }` → `{ sale: Sale }`
  - ATOMIC via `db.$transaction`:
    1. For each item: fetch product + variant, validate stock >= quantity, compute subtotal = price*qty, cost line = cost*qty.
    2. Generate invoiceNo: `INV-YYYYMM-NNNN` (sequence per month; simplest: count+1001).
    3. Create Sale (snapshot totals, profit), create SaleItems (snapshot name/sku/variantLabel/price/cost/subtotal), decrement variant stock, create OUT StockMovement (quantity=-qty, reason="Penjualan", saleId, userId).
    4. Re-validate stock inside transaction (using a fresh read or update with conditional). If any insufficient → throw → transaction rolls back, return 400.
  - `changeAmount = paidAmount - total` (may be 0 for exact).
  - Auth required (any role).

### Reports — `/api/reports`
- `GET /summary?from=&to=&categoryId=` → `SummaryReport`
  - omzet = sum(sale.total) in range; totalCost = sum(saleItem.cost*qty) in range; profit = omzet - totalCost; txCount = count(sales); avgPerTx = omzet/txCount; stockInUnits = sum(stockMovement IN), stockOutUnits = sum(OUT abs), adjustUnits = sum(ADJUST signed); stockInValue = sum(IN * product.cost), stockOutValue = sum(OUT abs * product.cost); cogsSold = totalCost.
- `GET /top-products?from=&to=&limit=5&categoryId=` → `TopProduct[]`
- `GET /top-categories?from=&to=` → `TopCategory[]`
- `GET /sales-trend?from=&to=&granularity=day|month` → `SalesTrendPoint[]` (label = "YYYY-MM-DD" or "YYYY-MM")
- `GET /low-stock` → `LowStockItem[]`
- `GET /stock-flow?from=&to=` → `StockFlow`
All require auth.

### Insights — `/api/insights`
- `GET` → `InsightReport` (auth)
  - Look at last 60d. If < 14 days of sales OR < 5 total sales in 60d → `insufficientData:true`, message explaining need for more sales history, empty arrays.
  - restock: variants where stock <= lowStockThreshold OR (velocity30d > 0 AND daysUntilOut = stock/velocity <= 7). velocity30d = units sold last 30d / 30. recommendation string in Indonesian.
  - topSellers: top 5 by qty last 30d.
  - declining: products with prevQty (14-28d ago) >= 5 AND lastQty (last 14d) and changePct = (last-prev)/prev*100 < -30. Sort by changePct asc.

### Upload — `/api/upload`
- `POST` multipart, field `file` (image) → `{ url:string }` [ADMIN]
  - Saves to /public/uploads, returns `/uploads/<name>`.

## Error format
`{ error: string }` with appropriate HTTP status (400, 401, 403, 404, 500).

## Frontend file structure (suggested)
- `src/app/page.tsx` — root; uses `useSession` + `useUIStore` to render `<Landing/>` or `<AdminShell/>`.
- `src/lib/ui-store.ts` — Zustand store.
- `src/lib/types.ts` — shared types (copy from above).
- `src/lib/format.ts` — `formatRupiah(n)`, `formatDate(iso)`, etc.
- `src/lib/api.ts` — fetch wrappers: `apiGet`, `apiPost`, `apiPatch`, `apiDelete` (throw on !ok with `{error}`).
- `src/components/landing/*` — Landing sections.
- `src/components/admin/admin-shell.tsx` — sidebar + outlet.
- `src/components/admin/dashboard.tsx`
- `src/components/admin/catalog.tsx` (products + categories tabs)
- `src/components/admin/inventory.tsx` (stock movements + suppliers + low stock)
- `src/components/admin/pos.tsx`
- `src/components/admin/reports.tsx`
- `src/components/admin/insights.tsx`
- `src/components/admin/login-dialog.tsx`

## UI/UX rules
- Use shadcn/ui components (already in src/components/ui).
- Sticky footer on landing (mt-auto on footer, root min-h-screen flex flex-col — already set on body).
- Responsive: mobile-first, sidebar collapses to top nav on small screens.
- Color theme already set (cream/brown/terracotta/gold). Use `bg-background`, `text-foreground`, `text-primary`, `bg-accent`, `text-gold` (custom), `border-border`.
- Use `sonner` toast for feedback (Toaster already in layout).
- Use recharts for dashboard/reports charts.
- Format money with `formatRupiah` → "Rp 185.000".
- Long lists: `max-h-96 overflow-y-auto scroll-soft` custom scrollbar (class defined in globals.css).
