"use client";

import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "./auth-provider";
import { useRouter } from "next/navigation";

interface RequireAuthProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Wrapper component that requires authentication
 * Shows loading state, login prompt, or children based on auth state
 */
export function RequireAuth({ children, fallback }: RequireAuthProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-sm text-zinc-500">验证登录状态...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-8 h-8 text-zinc-400" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            需要登录
          </h2>
          <p className="text-zinc-500 mb-6">
            请登录以访问此页面
          </p>
          <Button onClick={() => router.push("/login")} className="gap-2">
            <LogIn className="w-4 h-4" />
            前往登录
          </Button>
        </div>
      </div>
    );
  }

  // Authenticated - render children
  return <>{children}</>;
}
