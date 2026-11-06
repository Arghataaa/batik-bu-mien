"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import { useUIStore } from "@/lib/ui-store";
import { Landing } from "@/components/landing/landing";
import { AdminShell } from "@/components/admin/admin-shell";
import { LoginDialog } from "@/components/admin/login-dialog";

export default function Home() {
  const { status, data: session } = useSession();
  const view = useUIStore((s) => s.view);
  const setView = useUIStore((s) => s.setView);

  // When session state resolves, sync view: if logged in -> admin.
  useEffect(() => {
    if (status === "authenticated" && view !== "admin") {
      setView("admin");
    } else if (status === "unauthenticated" && view === "admin") {
      setView("landing");
    }
  }, [status, view, setView]);

  // Hash listener: open login dialog when URL has #admin
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash.toLowerCase() === "#admin") {
        useUIStore.getState().openLogin();
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  if (status === "loading") {
    return <FullScreenSkeleton />;
  }

  // Authenticated users always go to admin shell.
  // Unauthenticated: show landing + login dialog.
  if (session && status === "authenticated") {
    return <AdminShell />;
  }

  return (
    <>
      <Landing />
      <LoginDialog />
    </>
  );
}

function FullScreenSkeleton() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background batik-pattern gap-6">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Memuat Batik Bu Mien…</p>
      </div>
      <div className="w-full max-w-3xl px-4 space-y-3">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}
