"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "./auth-provider";

interface AuthGuardProps {
  children: React.ReactNode;
}

// Pages that don't require authentication
const PUBLIC_PATHS = ["/login"];

export function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    // If not logged in and trying to access protected page, redirect to login
    if (!user && !isPublicPath) {
      router.push("/login");
    }
  }, [user, isLoading, isPublicPath, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-sm text-zinc-500">加载中...</p>
        </div>
      </div>
    );
  }

  // If on public path, always show content
  if (isPublicPath) {
    return <>{children}</>;
  }

  // If not logged in and not on public path, show loading (will redirect)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-sm text-zinc-500">正在跳转到登录页...</p>
        </div>
      </div>
    );
  }

  // User is logged in, show content
  return <>{children}</>;
}
