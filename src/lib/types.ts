// Shared types — copied verbatim from CONTRACT.md

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  createdAt: string;
  _count?: { products: number };
};

export type Supplier = {
  id: string;
  name: string;
  contact?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt: string;
};

export type ProductVariant = {
  id: string;
  productId: string;
  sku: string;
  size?: string | null;
  color?: string | null;
  motif?: string | null;
  stock: number;
  weight: number;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  category?: Category;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  cost?: number | null;
  active: boolean;
  lowStockThreshold: number;
  hasVariants: boolean;
  weight: number;
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
  totalStock?: number; // computed: sum of variants stock
};

export type StockMovement = {
  id: string;
  productId: string;
  variantId?: string | null;
  type: "IN" | "OUT" | "ADJUST";
  quantity: number;
  reason?: string | null;
  supplierId?: string | null;
  supplier?: Supplier | null;
  saleId?: string | null;
  userId?: string | null;
  createdAt: string;
  product?: { id: string; name: string; sku: string };
  variant?:
    | {
        id: string;
        sku: string;
        size?: string | null;
        color?: string | null;
        motif?: string | null;
      }
    | null;
};

export type SaleItem = {
  id: string;
  saleId: string;
  productId: string;
  variantId?: string | null;
  name: string;
  sku: string;
  variantLabel?: string | null;
  price: number;
  cost: number;
  quantity: number;
  subtotal: number;
};

export type Sale = {
  id: string;
  invoiceNo: string;
  total: number;
  totalCost: number;
  totalProfit: number;
  paymentMethod: string;
  paidAmount: number;
  changeAmount: number;
  userId?: string | null;
  customerName?: string | null;
  note?: string | null;
  createdAt: string;
  items: SaleItem[];
};

export type SummaryReport = {
  omzet: number;
  profit: number;
  totalCost: number;
  txCount: number;
  avgPerTx: number;
  stockInUnits: number;
  stockOutUnits: number;
  stockInValue: number;
  stockOutValue: number;
  cogsSold: number;
};

export type TopProduct = {
  productId: string;
  name: string;
  sku: string;
  qty: number;
  revenue: number;
  profit: number;
};

export type TopCategory = {
  categoryId: string;
  name: string;
  qty: number;
  revenue: number;
  profit: number;
};

export type SalesTrendPoint = {
  label: string;
  revenue: number;
  profit: number;
  txCount: number;
};

export type LowStockItem = {
  productId: string;
  name: string;
  sku: string;
  variantId?: string | null;
  variantLabel?: string | null;
  stock: number;
  lowStockThreshold: number;
};

export type StockFlow = {
  inUnits: number;
  outUnits: number;
  adjustUnits: number;
  inValue: number;
  outValue: number;
};

export type InsightReport = {
  insufficientData: boolean;
  message?: string;
  restock: {
    productId: string;
    name: string;
    variantId?: string | null;
    variantLabel?: string | null;
    stock: number;
    lowStockThreshold: number;
    velocity30d: number;
    recommendation: string;
  }[];
  topSellers: {
    productId: string;
    name: string;
    sku: string;
    qty: number;
    revenue: number;
    profit: number;
  }[];
  declining: {
    productId: string;
    name: string;
    sku: string;
    prevQty: number;
    lastQty: number;
    changePct: number;
  }[];
};

// ----- Request payload types (used by forms / POS) -----

export type ProductVariantInput = {
  id?: string;
  sku: string;
  size?: string | null;
  color?: string | null;
  motif?: string | null;
  stock: number;
  weight?: number;
};

export type ProductInput = {
  name: string;
  sku: string;
  categoryId: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  cost?: number | null;
  active?: boolean;
  lowStockThreshold?: number;
  hasVariants: boolean;
  weight?: number;
  variants: ProductVariantInput[];
};

export type StockMovementInput = {
  productId: string;
  variantId?: string | null;
  type: "IN" | "OUT" | "ADJUST";
  quantity?: number;
  newStock?: number;
  reason?: string | null;
  supplierId?: string | null;
};

export type SaleInput = {
  items: { productId: string; variantId: string; quantity: number }[];
  paymentMethod: "CASH" | "QRIS" | "DEBIT" | "TRANSFER";
  paidAmount: number;
  customerName?: string | null;
  note?: string | null;
};

export type UploadResult = { url: string };

export type ApiError = { error: string };
