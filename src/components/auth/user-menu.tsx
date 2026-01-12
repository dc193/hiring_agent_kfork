"use client";

import { useState, useRef, useEffect } from "react";
import { LogIn, LogOut, User, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "./auth-provider";
import { useRouter } from "next/navigation";

export function UserMenu() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-zinc-400">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  // Not logged in - redirect to login page
  if (!user) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push("/login")}
        className="gap-2"
      >
        <LogIn className="w-4 h-4" />
        登录
      </Button>
    );
  }

  // Logged in - show user menu
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 max-w-[120px] truncate">
          {user.name}
        </span>
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 py-1 z-50">
          {/* User info */}
          <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {user.name}
            </p>
            <p className="text-xs text-zinc-500 truncate">
              @{user.username}
            </p>
          </div>

          {/* Logout button */}
          <button
            onClick={async () => {
              setIsOpen(false);
              await logout();
              router.push("/login");
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            登出
          </button>
        </div>
      )}
    </div>
  );
}
