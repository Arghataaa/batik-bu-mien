# Batik Bu Mien — Work Log

Project: Batik Bu Mien POS + Inventory + Dashboard (ready-to-wear batik products).
Stack enforced by sandbox: Next.js 16 + TypeScript + Tailwind 4 + shadcn/ui + Prisma (SQLite) + NextAuth v4 + local image storage (Supabase unavailable in sandbox; functional equivalents used).
Single user-visible route: `/` (SPA with client-side view switching).

---
Task ID: 1
Agent: main (orchestrator)
Task: Set up foundation — Prisma schema, db push, seed data, NextAuth, upload lib, theme colors (cream/brown/terracotta/gold).

Work Log:
- Designed full schema for ready-to-wear batik catalog with flexible categories + optional variants (size/color/motif).
- Models: User, Category, Supplier, Product, ProductVariant, StockMovement, Sale, SaleItem.
- Every product always has at least one ProductVariant (uniform inventory logic; "simple" product = single default variant with null size/color/motif).
- StockMovement signed quantity with type (IN/OUT/ADJUST), optional supplierId + saleId + userId traceability.
- SaleItem stores price/cost/name/sku/variantLabel snapshot so future price changes never mutate sales history.
- NextAuth credentials provider, JWT session, bcrypt password hashing.
- Local image upload to /public/uploads (returns relative URL).
- Theme: cream background, brown/terracotta primary, gold accents (modern heritage).

---
Task ID: 2-a
Agent: main (orchestrator)
Task: Generate premium landing page images via image-generation skill.

Work Log:
- Created scripts/gen-landing-images.ts using z-ai-web-dev-sdk.
- Generating 6 images into /public/landing/: hero.png (1440x720), kemeja-batik.png, daster-batik.png, sarung.png, sorban.png, blangkon.png (1024x1024 each).
- Prompts emphasize modern heritage aesthetic (cream/brown/terracotta/gold), premium e-commerce catalog styling, ready-to-wear batik products (NOT raw fabric).

Stage Summary:
- Images generated to /public/landing/*.png. Landing page references /landing/*.png.
- See gen-images.log for details.

---
Task ID: CONTRACT
Agent: main
Task: Define API + frontend contract for parallel backend/frontend agents.

Work Log:
- Wrote /home/z/my-project/CONTRACT.md with full type definitions, endpoint list, request/response shapes, error format, frontend file structure, UI/UX rules.
- Backend (Task 3) and Frontend (Task 4) agents MUST follow this contract.

Stage Summary:
- CONTRACT.md is the source of truth for integration.

---
Task ID: 3
Agent: full-stack-developer (backend)
Task: Build all backend API routes per CONTRACT.md.

Work Log:
- Created src/lib/api-helpers.ts: jsonError, apiRun wrapper (catches Response from auth guards + general errors → {error}), adminGuard/userGuard (return SessionUser), parseJsonBody, qInt, qDate.
- Created NextAuth route src/app/api/auth/[...nextauth]/route.ts (handler GET/POST).
- Created src/app/api/categories/route.ts (GET list with _count.products, POST with auto slugify + uniqueness loop).
- Created src/app/api/categories/[id]/route.ts (GET, PATCH re-slugs on rename, DELETE blocks if products exist).
- Created src/app/api/suppliers/route.ts (GET, POST).
- Created src/app/api/suppliers/[id]/route.ts (GET, PATCH, DELETE blocks if StockMovements reference).
- Created src/app/api/products/route.ts (GET list with search/categoryId/active filters + computed totalStock; POST creates product + variants in one create call + initial IN movements for non-zero starting stock).
- Created src/app/api/products/[id]/route.ts (GET single with variants, PATCH merges variants: existing update / new create / missing delete-if-no-saleItems, DELETE soft-set active=false if sales exist else hard delete).
- Created src/app/api/stock/route.ts (GET list with filters, POST IN/OUT/ADJUST logic with variant ownership validation + signed quantity).
- Created src/app/api/stock/alerts/route.ts (GET low-stock variants sorted by severity).
- Created src/app/api/sales/route.ts (GET list, POST ATOMIC via db.$transaction — validates stock inside tx with tx.productVariant.findUnique + decrement; throws on insufficient → rollback; snapshots name/sku/variantLabel/price/cost; generates invoiceNo INV-YYYYMM-NNNN; creates OUT StockMovement with quantity=-qty).
- Created src/app/api/sales/[id]/route.ts (GET single with items).
- Created src/app/api/reports/summary/route.ts (omzet/totalCost/profit/txCount/avgPerTx/stockIn+Out units+value/cogsSold).
- Created src/app/api/reports/top-products/route.ts.
- Created src/app/api/reports/top-categories/route.ts.
- Created src/app/api/reports/sales-trend/route.ts (day/month granularity, fills missing dates for continuous charts).
- Created src/app/api/reports/low-stock/route.ts.
- Created src/app/api/reports/stock-flow/route.ts.
- Created src/app/api/insights/route.ts (insufficientData flag when distinctDays<14 OR salesCount<5 in 60d; restock with velocity30d + daysUntilOut<=7; topSellers top 5 last 30d; declining prev 14-28d vs last 14d with changePct<-30).
- Created src/app/api/upload/route.ts (multipart POST using saveUploadedImage).
- Auth guards: GET reads require any logged-in user; POST/PATCH/DELETE on categories/suppliers/products/stock/upload require ADMIN; sales POST requires any logged-in user; reports/insights require any logged-in user.

Key Decisions:
- format.ts and types.ts were initially authored by me but the FRONTEND agent (Task 4) has since overwritten them with their own versions (compatible — I adapted all imports). The frontend's format.ts exports `variantLabel` returning string; my API code imports it as `buildLabel` and converts "" → null for nullable variantLabel fields.
- `apiRun` wrapper centralises error handling: thrown `Response` (auth) → JSON `{error}` with proper status; thrown `Error` → `{error: msg}` with status 400.
- Atomic sales transaction: validates variant.stock ≥ quantity via fresh tx.productVariant.findUnique inside the transaction; throws → entire transaction (sale + items + stock decrements + OUT movements) rolls back; error message includes product name + variant label + current stock + requested qty.
- InvoiceNo generated inside transaction via tx.sale.count for current month (format INV-YYYYMM-NNNN, NNNN = count + 1001).

Stage Summary:
- All 21 API route files implemented per CONTRACT.md. No TODOs/stubs.
- `bun run lint` PASSES: 0 errors, 0 warnings on backend files. (5 warnings remain in frontend agent's landing/admin components — out of scope.)
- `npx tsc --noEmit --skipLibCheck` PASSES for all backend files.
- IMPORTANT CAVEAT: Dev server currently returns HTTP 500 for ALL routes (including /api/auth/session) because the frontend agent's `src/components/admin/admin-shell.tsx` statically imports `./pos`, `./reports`, `./insights` component files that have not been created yet. This breaks the entire project compilation (because page.tsx statically imports admin-shell). Once the frontend agent (Task 4) creates those missing files, all backend routes will work.
- Detailed work record at: /home/z/my-project/agent-ctx/3-backend.md

---
Task ID: 5
Agent: main (orchestrator)
Task: Integration, bug fixes, agent-browser self-verification of all core flows.

Work Log:
- Backend (Task 3) + Frontend (Task 4) built by subagents per CONTRACT.md.
- Found + fixed 2 integration bugs during browser verification:
  1. invoiceNo unique-constraint collision: backend used per-month count, seed used global counter → collision. Fixed backend `/api/sales/route.ts` to use global sale count + 1001 with a 4-attempt retry loop on unique-constraint errors. Wrapped transaction in `runSaleTransaction()` helper.
  2. Seed drove some variant stocks negative (random sales exceeded initial stock). Fixed `prisma/seed.ts` to track remaining stock per variant and only sell available quantities (capped qty to max remaining).
- Re-seeded with clean data (no negative stocks).
- Verified all flows via agent-browser:
  * Landing renders (hero + 6 category cards + catalog preview + story + CTA + sticky footer), hero image loads (1024px).
  * Login (admin@batikbumien.test / admin123) → JWT session works.
  * Dashboard: Omzet Rp 10.465.000, Keuntungan Rp 4.405.000, 36 tx, charts (tren/top produk/top kategori), low-stock list, stock flow. Real data, no errors.
  * Catalog: 11 products table + Kategori tab; added new "Sandal Batik" category via UI → now 7 categories (admin can add categories without code change ✓).
  * Inventory: 80 stock movements, filters, Pemasok + Stok Menipis tabs.
  * POS: add to cart → set paid → checkout → atomic transaction → receipt dialog (INV-202610-1039, items, total, change Rp 5.000, "Cetak Struk" print button). Stock decremented correctly.
  * Reports: KPIs + charts + top products table.
  * Insights: restock recs (data-driven), top sellers, declining (Δ%), footnote "Berdasarkan data aktual penjualan. Tanpa prediksi." (no fake predictions ✓).
  * Mobile responsive: sidebar collapses to "Buka menu" drawer.
  * Sticky footer: body min-h-screen flex flex-col + footer mt-auto (verified in CSS).
- VLM analysis of landing screenshot confirmed premium "modern heritage" aesthetic (cream/brown/terracotta/gold) and striking hero image.
- `bun run lint` passes (0 errors). No console/runtime errors during testing.

Stage Summary:
- All 7 user requirements met: flexible catalog + variants, inventory (in/out/adjust/history/low-stock/suppliers), atomic POS with price snapshot + receipt, dashboard + reports with filters, data-driven insights (no predictions), Supabase-equivalent schema (Prisma+SQLite in sandbox), premium landing page.
- Live at / (port 3000). Credentials: admin@batikbumien.test/admin123 (ADMIN), kasir@batikbumien.test/kasir123 (KASIR).
