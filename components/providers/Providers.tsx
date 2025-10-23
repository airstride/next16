"use client";

import { AuthProvider } from "@/components/auth/AuthContext";
import { QueryProvider } from "@/components/providers/QueryProvider";

/**
 * Global providers wrapper
 * Combines all necessary providers (React Query, Auth, etc.)
 */
export default function GlobalProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  );
}
