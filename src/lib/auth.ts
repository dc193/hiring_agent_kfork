// CS Account Service Configuration
export const AUTH_CONFIG = {
  serviceUrl: "https://account.coinsummer.com",
  tokenName: "cs_user_token",
  cookieDomain: ".coinsummer.com",
} as const;

// User type from CS Account service
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string;
  picture: string;
}

// JWT Claims structure
export interface JWTClaims {
  user_id: string;
  email: string;
  name: string;
  picture: string;
  username: string;
  iss: string;
  exp: number;
  iat: number;
}

/**
 * Get login URL with redirect (client-safe)
 */
export function getLoginUrl(redirectUrl?: string): string {
  const redirect = redirectUrl || (typeof window !== "undefined" ? window.location.href : "");
  const encodedRedirect = encodeURIComponent(redirect);
  return `${AUTH_CONFIG.serviceUrl}/api/auth/google/login?redirect=${encodedRedirect}`;
}

/**
 * Get logout URL (client-safe)
 */
export function getLogoutUrl(): string {
  return `${AUTH_CONFIG.serviceUrl}/api/auth/logout`;
}
