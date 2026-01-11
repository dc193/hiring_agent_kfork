import { cookies } from "next/headers";
import { AUTH_CONFIG, AuthUser } from "./auth";

/**
 * Get current user from CS Account service (server-side only)
 * Uses cookies to authenticate
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_CONFIG.tokenName);

    if (!token?.value) {
      return null;
    }

    const response = await fetch(`${AUTH_CONFIG.serviceUrl}/api/auth/user`, {
      headers: {
        Cookie: `${AUTH_CONFIG.tokenName}=${token.value}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const user = await response.json();
    return user as AuthUser;
  } catch (error) {
    console.error("Failed to get auth user:", error);
    return null;
  }
}

/**
 * Check if user is authenticated (server-side only)
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthUser();
  return user !== null;
}

/**
 * Get auth token from cookies (server-side only, for API routes)
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_CONFIG.tokenName);
    return token?.value || null;
  } catch {
    return null;
  }
}
