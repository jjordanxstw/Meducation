/**
 * Unified HTTP Client Configuration
 *
 * Features:
 * - Centralized axios instance for all API calls
 * - Automatic authentication via httpOnly cookies
 * - CSRF protection support
 * - Security headers
 * - Error handling with security considerations
 * - Request/response interceptors for token management
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { sanitizeErrorMessage } from './security/tokens';
import { logSecurityEvent } from './security';

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const API_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10); // 30 seconds default

// Request ID counter for tracking
let requestIdCounter = 0;

/**
 * Generate unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${++requestIdCounter}`;
}

/**
 * Create axios instance with security defaults
 */
const createHttpClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    withCredentials: true, // Essential for httpOnly cookie authentication
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  return instance;
};

export const httpClient = createHttpClient();

/**
 * Request interceptor - Add security headers and tracking
 */
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Generate request ID for tracking
    const requestId = generateRequestId();
    config.headers['X-Request-ID'] = requestId;

    // Add CSRF token if available (for future implementation)
    // const csrfToken = getCSRFToken();
    // if (csrfToken) {
    //   config.headers['X-CSRF-Token'] = csrfToken;
    // }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[HTTP] ${config.method?.toUpperCase()} ${config.url}`, {
        requestId,
        hasAuth: !!config.headers['Authorization'],
      });
    }

    return config;
  },
  (error: AxiosError) => {
    logSecurityEvent('request_interceptor_error', {
      error: sanitizeErrorMessage(error),
    });
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle errors and security events
 */
httpClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[HTTP] ${response.config.method?.toUpperCase()} ${response.config.url} -> ${response.status}`, {
        requestId: response.config.headers['X-Request-ID'],
      });
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const requestId = originalRequest?.headers['X-Request-ID'] as string;

    // Log errors
    if (process.env.NODE_ENV === 'development') {
      console.error(`[HTTP Error] ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
        status: error.response?.status,
        requestId,
        error: sanitizeErrorMessage(error),
      });
    }

    // Handle specific error statuses
    if (error.response) {
      const status = error.response.status;
      const url = originalRequest?.url;

      switch (status) {
        case 401:
          // Unauthorized - User needs to re-authenticate
          logSecurityEvent('http_401_unauthorized', {
            url,
            requestId,
          });

          // Don't automatically redirect - let the auth provider handle it
          // This prevents redirect loops and allows proper cleanup
          break;

        case 403:
          // Forbidden - User is authenticated but lacks permission
          logSecurityEvent('http_403_forbidden', {
            url,
            requestId,
          });
          console.error('[Security] Access forbidden:', url);
          break;

        case 404:
          // Not found
          console.warn('[HTTP] Resource not found:', url);
          break;

        case 429:
          // Too Many Requests - Rate limited
          logSecurityEvent('http_429_rate_limited', {
            url,
            requestId,
          });
          console.warn('[HTTP] Rate limit exceeded for:', url);
          break;

        case 500:
        case 502:
        case 503:
        case 504:
          // Server errors
          logSecurityEvent('http_server_error', {
            url,
            status,
            requestId,
          });
          break;

        default:
          logSecurityEvent('http_error', {
            url,
            status,
            requestId,
          });
      }
    } else if (error.request) {
      // Request made but no response received
      logSecurityEvent('http_no_response', {
        url: originalRequest?.url,
        requestId,
      });
    } else {
      // Error setting up request
      logSecurityEvent('http_request_setup_error', {
        error: sanitizeErrorMessage(error),
      });
    }

    // Don't modify error - let calling code handle it
    return Promise.reject(error);
  }
);

/**
 * Type-safe API request methods
 */
export const api = {
  get: <T = unknown>(url: string, config?: InternalAxiosRequestConfig) =>
    httpClient.get<T>(url, config),

  post: <T = unknown>(url: string, data?: unknown, config?: InternalAxiosRequestConfig) =>
    httpClient.post<T>(url, data, config),

  put: <T = unknown>(url: string, data?: unknown, config?: InternalAxiosRequestConfig) =>
    httpClient.put<T>(url, data, config),

  patch: <T = unknown>(url: string, data?: unknown, config?: InternalAxiosRequestConfig) =>
    httpClient.patch<T>(url, data, config),

  delete: <T = unknown>(url: string, config?: InternalAxiosRequestConfig) =>
    httpClient.delete<T>(url, config),
};

/**
 * Check if network is available (for offline handling)
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Retry request with exponential backoff
 */
export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on authentication/authorization errors
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401 || status === 403 || status === 404) {
          throw error;
        }
      }

      // Wait before retry (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve =>
          setTimeout(resolve, baseDelay * Math.pow(2, i))
        );
      }
    }
  }

  throw lastError!;
}

export default httpClient;
