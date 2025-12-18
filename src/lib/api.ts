import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { clearAuthState } from "@/utils/authStorage";

// Create axios instance with default config
const axiosInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add token to private requests
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage or window (for client-side)
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle common errors
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    const requestUrl = error.config?.url || "";
    
    // Don't redirect for login/registration endpoints - let them handle errors themselves
    const isAuthEndpoint = 
      requestUrl.includes("/auth/login") || 
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/verify-otp") ||
      requestUrl.includes("/auth/send-otp");
    
    // Handle 401 Unauthorized - Token expired or invalid (only for authenticated endpoints)
    if (error.response?.status === 401 && !isAuthEndpoint) {
      if (typeof window !== "undefined") {
        // Clear all auth data from localStorage and sessionStorage
        clearAuthState();
        // Redirect to login page
        window.location.href = "/";
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error("Access forbidden:", error.response.data);
    }

    // Handle network errors
    if (!error.response) {
      console.error("Network error:", error.message);
    }

    return Promise.reject(error);
  }
);

// Helper function to get token from various sources
const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    // Try to get from localStorage first
    const token = localStorage.getItem("authToken");
    if (token) return token;

    // Could also get from Redux store if needed
    // This would require importing the store
  }
  return null;
};

/**
 * Public API call - No authentication token required
 * @param endpoint - API endpoint (e.g., '/auth/login')
 * @param config - Axios request configuration
 * @returns Promise with response data
 */
export const publicApiCall = async <T = any>(
  endpoint: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await axiosInstance.get<T>(endpoint, {
      ...config,
      headers: {
        ...config?.headers,
        // Ensure no Authorization header for public calls
        Authorization: undefined,
      },
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Public POST API call - No authentication token required
 * @param endpoint - API endpoint
 * @param data - Request body data
 * @param config - Axios request configuration
 * @returns Promise with response data
 */
export const publicApiPost = async <T = any>(
  endpoint: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await axiosInstance.post<T>(endpoint, data, {
      ...config,
      headers: {
        ...config?.headers,
        Authorization: undefined,
      },
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Private API call - Automatically includes authentication token
 * @param endpoint - API endpoint (e.g., '/users/profile')
 * @param config - Axios request configuration
 * @returns Promise with response data
 */
export const privateApiCall = async <T = any>(
  endpoint: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const token = getToken();
    if (!token) {
      // Clear all auth data and redirect to login
      if (typeof window !== "undefined") {
        clearAuthState();
        window.location.href = "/";
      }
      throw new Error("No authentication token found. Please login again.");
    }

    const response = await axiosInstance.get<T>(endpoint, {
      ...config,
      headers: {
        ...config?.headers,
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Private POST API call - Automatically includes authentication token
 * @param endpoint - API endpoint
 * @param data - Request body data
 * @param config - Axios request configuration
 * @returns Promise with response data
 */
export const privateApiPost = async <T = any>(
  endpoint: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const token = getToken();
    if (!token) {
      // Clear all auth data and redirect to login
      if (typeof window !== "undefined") {
        clearAuthState();
        window.location.href = "/";
      }
      throw new Error("No authentication token found. Please login again.");
    }

    const response = await axiosInstance.post<T>(endpoint, data, {
      ...config,
      headers: {
        ...config?.headers,
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Private PUT API call - Automatically includes authentication token
 * @param endpoint - API endpoint
 * @param data - Request body data
 * @param config - Axios request configuration
 * @returns Promise with response data
 */
export const privateApiPut = async <T = any>(
  endpoint: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const token = getToken();
    if (!token) {
      // Clear all auth data and redirect to login
      if (typeof window !== "undefined") {
        clearAuthState();
        window.location.href = "/";
      }
      throw new Error("No authentication token found. Please login again.");
    }

    const response = await axiosInstance.put<T>(endpoint, data, {
      ...config,
      headers: {
        ...config?.headers,
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Private DELETE API call - Automatically includes authentication token
 * @param endpoint - API endpoint
 * @param config - Axios request configuration
 * @returns Promise with response data
 */
export const privateApiDelete = async <T = any>(
  endpoint: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const token = getToken();
    if (!token) {
      // Clear all auth data and redirect to login
      if (typeof window !== "undefined") {
        clearAuthState();
        window.location.href = "/";
      }
      throw new Error("No authentication token found. Please login again.");
    }

    const response = await axiosInstance.delete<T>(endpoint, {
      ...config,
      headers: {
        ...config?.headers,
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Handle API errors and extract meaningful error messages
 */
const handleApiError = (error: unknown): Error => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      // Server responded with error status
      const message =
        (axiosError.response.data as any)?.message ||
        axiosError.message ||
        "An error occurred";
      return new Error(message);
    } else if (axiosError.request) {
      // Request was made but no response received
      return new Error("Network error. Please check your connection.");
    }
  }
  // Unknown error
  return error instanceof Error
    ? error
    : new Error("An unexpected error occurred");
};

/**
 * Set authentication token in localStorage
 * @param token - JWT token string
 */
export const setAuthToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("authToken", token);
  }
};

/**
 * Remove authentication token from localStorage
 */
export const removeAuthToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("authToken");
  }
};

// Export axios instance for custom use cases
export default axiosInstance;

