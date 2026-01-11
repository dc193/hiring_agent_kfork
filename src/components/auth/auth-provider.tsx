"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AUTH_CONFIG } from "@/lib/auth";

// User type
interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string;
  picture: string;
}

// Auth context type
interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user on mount
  const fetchUser = async () => {
    try {
      const response = await fetch(`${AUTH_CONFIG.serviceUrl}/api/auth/user`, {
        credentials: "include",
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Login - redirect to Google login
  const login = () => {
    const redirect = encodeURIComponent(window.location.href);
    window.location.href = `${AUTH_CONFIG.serviceUrl}/api/auth/google/login?redirect=${redirect}`;
  };

  // Logout
  const logout = async () => {
    try {
      await fetch(`${AUTH_CONFIG.serviceUrl}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    setIsLoading(true);
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
