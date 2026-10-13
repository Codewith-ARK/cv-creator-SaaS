"use client";
import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "@carbon/react";
import { ApiError } from "@/lib/api";

export default function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: {
    staleTime: 60000,
    retry: (count, error) => !(error instanceof ApiError && error.status && error.status < 500) && count < 1,
  } } }));
  return <QueryClientProvider client={client}><Theme theme="white">{children}</Theme></QueryClientProvider>;
}
