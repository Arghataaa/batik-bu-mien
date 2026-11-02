# Batik Bu Mien — Agent Instructions

Next.js 16 + TypeScript admin dashboard for batik inventory, sales, and stock management. PostgreSQL via Prisma ORM.

## Setup & Database

**Database:** PostgreSQL via Supabase (connection pooler, not direct).

```bash
npm install
```

`.env` must include `DATABASE_URL` pointing to Supabase transaction pooler:
```
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

Do NOT use direct connection (`db.*.supabase.co:5432`); it fails on Windows/restricted networks. Use pooler URL from **Supabase Dashboard → Connect → Transaction pooler**.

**Schema sync:**
```bash
npm run db:push              # sync schema changes to Supabase
npm run db:generate         # regenerate Prisma client
```

## Dev & Build

```bash
npm run dev                  # start Next.js dev server (port 3000)
npm run build               # build standalone output
npm run lint                # eslint check
```

Windows-specific: scripts use `npm` commands. No `tee` or Unix pipes—use PowerShell redirection if needed.

## Authentication & Users

- Credentials-based (email + bcrypt password hash).
- User roles: `ADMIN` | `KASIR` (cashier).
- NextAuth.js JWT strategy, 7-day session max.
- Auth config: `src/lib/auth.ts`; login form: `src/components/admin/login-dialog.tsx`.

**Initial admin user:** Create manually via SQL or `prisma/seed.ts`:
```sql
insert into "User" (id, email, name, "passwordHash", role)
values ('admin-id', 'admin@batikbumien', 'Bu Mien', '$2b$10$...', 'ADMIN');
```

Password hash must be bcrypt `$2b$10$` format. Generate with:
```powershell
node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('admin123',10).then(console.log)"
```

## Database Schema

Prisma models in `prisma/schema.prisma`:
- **User**: admin/kasir accounts, passwordHash, role.
- **Category**: product categories (kemeja, daster, sarung, etc.).
- **Product**: SKU, price, cost, stock threshold, variants toggle.
- **ProductVariant**: optional size/color/motif per product.
- **StockMovement**: atomic IN/OUT/ADJUST per product or variant; links supplier/sale/user.
- **Sale**: invoice, total, cost, profit snapshot, payment method.
- **SaleItem**: snapshot of product/variant name/price/sku at sale time.
- **Supplier**: source of stock (name, contact, phone).

Stock is snapshot-based at sale; stock movements logged separately. Variants optional per product.

## API Routes

REST API in `src/app/api/`:
- `POST /api/auth/callback/credentials` — NextAuth login.
- `/categories`, `/suppliers`, `/stock`, `/reports/*` — CRUD and reporting endpoints.

All queries use Prisma `db` singleton from `src/lib/db.ts` (auto-memoized in dev).

## Known Quirks

- Next.js output mode: `standalone` (for production portability).
- TypeScript: `ignoreBuildErrors: true` in `next.config.ts` — type issues do not block build.
- React strict mode disabled (`reactStrictMode: false`).
- Prisma logging: `log: ['query']` in dev; watch terminal for SQL.
- Seed script (`prisma/seed.ts`) **wipes all data** before re-seeding; used for dev reset only.

## Verification

```bash
npm run lint                # check for ESLint violations
npm run db:push             # validate schema
```

No dedicated test suite. Manual testing via UI or API.
