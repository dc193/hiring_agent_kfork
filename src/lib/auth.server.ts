import { cookies } from "next/headers";
import { AUTH_CONFIG, AuthUser } from "./auth";

/**
 * Get current user from session cookie (server-side only)
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(AUTH_CONFIG.cookieName);

    if (!session?.value) {
      return null;
    }

    // Decode the session (simple base64 encoded JSON)
    try {
      const decoded = Buffer.from(session.value, "base64").toString("utf-8");
      const user = JSON.parse(decoded) as AuthUser;
      return user;
    } catch {
      return null;
    }
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
 * Validate credentials against environment variables
 */
export function validateCredentials(username: string, password: string): AuthUser | null {
  const validUsername = process.env.AUTH_USERNAME;
  const validPassword = process.env.AUTH_PASSWORD;

  if (!validUsername || !validPassword) {
    console.error("AUTH_USERNAME or AUTH_PASSWORD not configured");
    return null;
  }

  if (username === validUsername && password === validPassword) {
    return {
      username,
      name: username, // Use username as display name
    };
  }

  return null;
}

/**
 * Create session value from user
 */
export function createSessionValue(user: AuthUser): string {
  return Buffer.from(JSON.stringify(user)).toString("base64");
}
