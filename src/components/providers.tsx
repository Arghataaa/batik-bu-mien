"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/components/shop/cart-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={client}><CartProvider>{children}</CartProvider></QueryClientProvider>
    </SessionProvider>
  );
}
