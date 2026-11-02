"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

export function MidtransSnap({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
        ? "https://app.midtrans.com/snap/snap.js"
        : "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute(
      "data-client-key",
      process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!
    );
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePay = () => {
    if (window.snap) {
      setLoading(true);
      window.snap.pay(token, {
        onSuccess: () => {
          window.location.reload();
        },
        onPending: (result) => {
          console.log("pending", result);
          setLoading(false);
        },
        onError: (result) => {
          console.log("error", result);
          setLoading(false);
        },
        onClose: () => {
          setLoading(false);
        },
      });
    }
  };

  return (
    <Button 
      onClick={handlePay} 
      disabled={loading}
      className="w-full bg-[#744628] hover:bg-[#5c361f] text-white"
    >
      <CreditCard className="mr-2 h-4 w-4" />
      {loading ? "Menyiapkan Pembayaran..." : "Bayar Sekarang"}
    </Button>
  );
}

