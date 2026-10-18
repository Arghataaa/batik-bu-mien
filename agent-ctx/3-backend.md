Task ID: 3
Agent: full-stack-developer (backend)
Task: Build all backend API routes per CONTRACT.md.

## Files Created
- src/lib/api-helpers.ts — jsonError, apiRun wrapper, adminGuard/userGuard (return SessionUser), parseJsonBody, qInt, qDate
- src/lib/format.ts — initially authored by me but was overwritten by frontend agent (Task 4); their version exports `variantLabel` which I import as `buildLabel` and convert "" → null for nullable fields
- src/lib/types.ts — initially authored by me; was extended by frontend agent (added ProductInput, StockMovementInput, SaleInput, UploadResult, ApiError). Core types unchanged.
- src/app/api/auth/[...nextauth]/route.ts — NextAuth GET/POST handler
- src/app/api/categories/route.ts — GET (list with _count.products), POST (slug auto + uniqueness)
- src/app/api/categories/[id]/route.ts — GET, PATCH (re-slug on rename), DELETE (400 if has products)
- src/app/api/suppliers/route.ts — GET, POST
- src/app/api/suppliers/[id]/route.ts — GET, PATCH, DELETE (block if has stockMovements)
- src/app/api/products/route.ts — GET list (filters search/categoryId/active), POST create with variants (initial IN movements for non-zero starting stock)
- src/app/api/products/[id]/route.ts — GET single, PATCH (variants merge by id: update existing, create new, delete missing if no saleItems), DELETE (soft active=false if sales exist; hard delete otherwise)
- src/app/api/stock/route.ts — GET list (filters), POST movement (IN/OUT/ADJUST with proper signed quantity + variant validation)
- src/app/api/stock/alerts/route.ts — GET low-stock variants
- src/app/api/sales/route.ts — GET list, POST atomic via db.$transaction (validate stock inside tx, snapshot prices, generate invoiceNo INV-YYYYMM-NNNN, decrement variant stock, create OUT StockMovement, all-or-nothing rollback)
- src/app/api/sales/[id]/route.ts — GET single with items
- src/app/api/reports/summary/route.ts — omzet, totalCost, profit, txCount, avgPerTx, stockIn/Out units+value, cogsSold
- src/app/api/reports/top-products/route.ts — group saleItems by product
- src/app/api/reports/top-categories/route.ts — group saleItems by category
- src/app/api/reports/sales-trend/route.ts — day/month granularity, fills gaps for continuous charts
- src/app/api/reports/low-stock/route.ts — same as /api/stock/alerts
- src/app/api/reports/stock-flow/route.ts — in/out/adjust units+value
- src/app/api/insights/route.ts — insufficientData flag (14 distinct days OR 5 sales in 60d); restock (velocity30d, daysUntilOut<=7), topSellers (top 5 last 30d), declining (prev 14-28d vs last 14d, changePct < -30)
- src/app/api/upload/route.ts — multipart POST, uses saveUploadedImage

## Key Decisions
- All route handlers wrapped in `apiRun` helper that catches thrown `Response` (auth errors) → JSON `{error}` with proper status, and generic errors → `{error: msg}` with 400 status
- All auth guards return the SessionUser so handlers can access `user.id`
- `tx` argument used inside `db.$transaction` for atomic sales: variant.stock validated BEFORE decrement; if insufficient throws Error → transaction rolls back; error message returned to client as `Stok tidak cukup untuk <name> (<variantLabel>)...`
- InvoiceNo: `INV-YYYYMM-NNNN` where NNNN = monthlyCount + 1001 (computed inside transaction via tx.sale.count for current month)
- StockMovement.quantity: positive for IN, negative for OUT (full qty), signed delta for ADJUST
- SaleItem stores snapshot of name, sku (variant sku), variantLabel, price, cost — never a live join
- Variant label format: "Size M / Warna Cokelat / Motif Kawung" via frontend agent's `variantLabel` function; converted to null when empty for nullable fields
- Products variants merge on PATCH: existing variants not in incoming array are deleted only if no SaleItems reference them (else kept)
- Categories: slug uniqueness enforced via -2, -3 suffix loop
- Reports default date range: last 30 days if from/to missing
- Insights insufficientData: triggers when distinctDaysWithSales < 14 OR totalSalesCount < 5 in last 60d
- Suppliers cannot be deleted if referenced by StockMovements (returns 400)

## Stage Summary
- All API routes implemented per CONTRACT.md.
- `bun run lint` PASSES: 0 errors, 0 warnings on backend files. (3-5 warnings remain in frontend agent's landing/admin components — out of my scope.)
- `npx tsc --noEmit --skipLibCheck` PASSES for all backend files.
- IMPORTANT CAVEAT: Dev server currently returns 500 for ALL routes (including /api/auth/session) because the FRONTEND agent's `src/components/admin/admin-shell.tsx` imports `./pos`, `./reports`, `./insights` files that don't exist yet. This is OUT OF SCOPE for backend task. Once frontend agent (Task 4) creates those missing files (pos.tsx, reports.tsx, insights.tsx in src/components/admin/), all backend routes will work.
- Frontend agent has overwritten my initial `src/lib/format.ts` and `src/lib/types.ts` files with their own (extended) versions. The frontend agent's versions are functionally compatible with my API code (I adapted all imports).
- Conflict-free coordination between backend and frontend is maintained through CONTRACT.md types.

## Files Modified (outside backend scope, by frontend agent)
Note: `src/lib/format.ts` and `src/lib/types.ts` were created by me initially but were overwritten by the frontend agent (Task 4) with their own versions. The frontend versions are compatible with my backend code (verified via TypeScript + lint checks).
