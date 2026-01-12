// Simple Auth Configuration
export const AUTH_CONFIG = {
  cookieName: "auth_session",
  cookieMaxAge: 60 * 60 * 24 * 30, // 30 days
} as const;

// User type
export interface AuthUser {
  username: string;
  name: string;
}
