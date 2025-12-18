/**
 * Utility functions to persist auth state in localStorage
 */

const AUTH_STORAGE_KEY = "authState";
const TOKEN_STORAGE_KEY = "authToken";

export interface StoredAuthState {
  user: {
    id: string;
    email: string;
    role: "admin" | "superadmin" | "customer" | null;
    name?: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    isActive?: boolean;
    isEmailVerified?: boolean;
  } | null;
  token: string | null;
  isAuthenticated: boolean;
}

/**
 * Save auth state to localStorage
 */
export const saveAuthState = (state: StoredAuthState): void => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
      if (state.token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, state.token);
      }
    } catch (error) {
      console.error("Error saving auth state:", error);
    }
  }
};

/**
 * Load auth state from localStorage
 */
export const loadAuthState = (): StoredAuthState | null => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const state = JSON.parse(stored);
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        return {
          ...state,
          token: state.token || token,
        };
      }
    } catch (error) {
      console.error("Error loading auth state:", error);
    }
  }
  return null;
};

/**
 * Clear ALL auth-related data from localStorage and sessionStorage
 * This function removes all possible authentication keys to ensure complete cleanup
 */
export const clearAuthState = (): void => {
  if (typeof window !== "undefined") {
    try {
      // Remove all auth-related keys from localStorage
      const authKeys = [
        AUTH_STORAGE_KEY,
        TOKEN_STORAGE_KEY,
        "authToken",
        "user",
        "token",
        "role",
        "authState",
        "auth_user",
        "auth_role",
        "auth_token",
        "refreshToken",
        "accessToken",
        "refresh_token",
        "access_token",
      ];

      authKeys.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      // Also clear any keys that might contain auth data
      // Clear all localStorage keys that start with 'auth' or contain 'token'
      const allKeys = Object.keys(localStorage);
      allKeys.forEach((key) => {
        const lowerKey = key.toLowerCase();
        if (
          lowerKey.includes("auth") ||
          lowerKey.includes("token") ||
          lowerKey.includes("user") ||
          lowerKey === "role"
        ) {
          localStorage.removeItem(key);
        }
      });

      // Clear sessionStorage keys as well
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach((key) => {
        const lowerKey = key.toLowerCase();
        if (
          lowerKey.includes("auth") ||
          lowerKey.includes("token") ||
          lowerKey.includes("user") ||
          lowerKey === "role"
        ) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error("Error clearing auth state:", error);
    }
  }
};

/**
 * Get stored role from localStorage
 */
export const getStoredRole = (): "admin" | "superadmin" | "customer" | null => {
  const state = loadAuthState();
  return state?.user?.role || null;
};

