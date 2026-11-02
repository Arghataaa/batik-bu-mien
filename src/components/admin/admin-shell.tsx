"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Shirt,
  PackageSearch,
  ShoppingCart,
  BarChart3,
  Lightbulb,
  LogOut,
  Menu,
  User as UserIcon,
  Package,
} from "lucide-react";
import { useUIStore, type AdminSection } from "@/lib/ui-store";
import { DashboardSection } from "./dashboard";
import { CatalogSection } from "./catalog";
import { InventorySection } from "./inventory";
import { POSSection } from "./pos";
import { ReportsSection } from "./reports";
import { InsightsSection } from "./insights";
import { OrdersSection } from "./orders";
import { cn } from "@/lib/utils";

type NavItem = {
  key: AdminSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
};

const NAV: NavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Ringkasan omzet, profit, dan stok",
  },
  {
    key: "catalog",
    label: "Katalog",
    icon: Shirt,
    description: "Produk dan kategori",
  },
  {
    key: "inventory",
    label: "Inventory",
    icon: PackageSearch,
    description: "Pergerakan stok & pemasok",
  },
  {
    key: "pos",
    label: "POS Kasir",
    icon: ShoppingCart,
    description: "Buat transaksi baru",
  },
  {
    key: "reports",
    label: "Laporan",
    icon: BarChart3,
    description: "Laporan penjualan & stok",
  },
  {
    key: "insights",
    label: "Insights",
    icon: Lightbulb,
    description: "Rekomendasi restock & tren",
  },
  {
    key: "orders",
    label: "Manajemen Pesanan",
    icon: Package,
    description: "Kelola pesanan & pengiriman",
  },
];

export function AdminShell() {
  const { data: session } = useSession();
  const adminSection = useUIStore((s) => s.adminSection);
  const setSection = useUIStore((s) => s.setSection);
  const setView = useUIStore((s) => s.setView);
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = session?.user?.role || "ADMIN";
  const isAdmin = true;

  async function handleLogout() {
    try {
      await signOut({ redirect: false });
      setView("landing");
      toast.success("Anda telah keluar.");
    } catch {
      toast.error("Gagal keluar.");
    }
  }

  function pick(key: AdminSection) {
    setSection(key);
    setMobileOpen(false);
  }

  const ActiveComponent = SECTION_COMPONENTS[adminSection];
  const activeMeta = NAV.find((n) => n.key === adminSection)!;

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 p-3">
      <div className="mb-2 flex items-center gap-2.5 px-2 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Shirt className="h-5 w-5" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">Batik Bu Mien</span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Admin Panel
          </span>
        </div>
      </div>

      <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Menu
      </div>
      <ul className="flex flex-col gap-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = adminSection === item.key;
          const lockedForKasir = !isAdmin && (item.key === "catalog" || item.key === "inventory");
          return (
            <li key={item.key}>
              <button
                onClick={() => pick(item.key)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="flex flex-col">
                  <span className="font-medium">{item.label}</span>
                  <span
                    className={cn(
                      "text-[11px]",
                      active ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}
                  >
                    {item.description}
                  </span>
                  {lockedForKasir && (
                    <span className="mt-0.5 inline-flex w-fit rounded bg-muted/60 px-1 py-0.5 text-[10px] text-muted-foreground">
                      Admin only
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto p-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </Button>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 border-r border-border bg-sidebar text-sidebar-foreground lg:block">
        <div className="sticky top-0 h-screen overflow-y-auto scroll-soft">
          {sidebar}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Buka menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Menu Navigasi</SheetTitle>
                </SheetHeader>
                {sidebar}
              </SheetContent>
            </Sheet>

            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">
                {activeMeta.label}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {activeMeta.description}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant={isAdmin ? "default" : "secondary"}
              className="capitalize"
            >
              {role}
            </Badge>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserIcon className="h-4 w-4" />
              </div>
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-sm font-medium">
                  {session?.user?.name || "Pengguna"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {session?.user?.email}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              aria-label="Keluar"
              title="Keluar"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
          <ActiveComponent />
        </main>
      </div>
    </div>
  );
}

const SECTION_COMPONENTS: Record<AdminSection, React.ComponentType> = {
  dashboard: DashboardSection,
  catalog: CatalogSection,
  inventory: InventorySection,
  pos: POSSection,
  reports: ReportsSection,
  insights: InsightsSection,
  orders: OrdersSection,
};
