import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { toast } from '../stores/toastStore';

// API base URL (backend port: 8080)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token storage (managed by Zustand store, but available before initialization)
let authToken: string | null = null;

// Set token
export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
};

// Get token
export const getAuthToken = (): string | null => {
  if (authToken) return authToken;
  return localStorage.getItem('accessToken');
};

// Request interceptor: Auto-add JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Convert API error messages to user-friendly format
 */
const getUserFriendlyMessage = (status: number | undefined, serverMessage: string): string => {
  // Server message mapping
  const messageMap: Record<string, string> = {
    // Channel/Post related
    'Channel not found': 'Channel not found.',
    'Post not found': 'Post not found.',
    'User not found': 'User not found.',
    'Comment not found': 'Comment not found.',
    'You do not have access to this channel': 'You don\'t have access to this channel.',
    'Insufficient subscriber count': 'Insufficient subscriber count.',
    // Auth related
    'Unauthorized': 'Please log in.',
    'Invalid token': 'Your login session is invalid.',
    'Token expired': 'Your session has expired.',
    // Validation
    'Bad Request': 'Please check your input.',
    'Validation failed': 'Please check your input.',
    // Server errors
    'Internal server error': 'Server error. Please try again later.',
  };

  // Exact match
  if (messageMap[serverMessage]) {
    return messageMap[serverMessage];
  }

  // Partial match
  for (const [key, value] of Object.entries(messageMap)) {
    if (serverMessage.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // HTTP status code based default messages
  const statusMessages: Record<number, string> = {
    400: 'Please check your input.',
    403: 'Access denied.',
    404: 'Not found.',
    409: 'This request has already been processed.',
    429: 'Too many requests. Please try again later.',
    500: 'Server error. Please try again later.',
    502: 'Cannot connect to server.',
    503: 'Service is under maintenance.',
  };

  if (status && statusMessages[status]) {
    return statusMessages[status];
  }

  // Default message
  return 'An error occurred while processing your request.';
};

// Response interceptor: Error handling and token expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Extract error message (message can be array - NestJS validation)
    const errorData = error.response?.data as { message?: string | string[] } | undefined;
    let serverMessage = '';
    if (Array.isArray(errorData?.message)) {
      serverMessage = errorData.message[0] || '';
    } else {
      serverMessage = errorData?.message || error.message || '';
    }
    const userMessage = getUserFriendlyMessage(error.response?.status, serverMessage);

    // 401 error: Token expired or auth failure
    if (error.response?.status === 401) {
      // Remove token and redirect to login
      setAuthToken(null);

      // Dispatch event (handled by App)
      window.dispatchEvent(new CustomEvent('auth:logout'));
      toast.error('Your session has expired. Please log in again.');
    } else if (!error.response) {
      // Network error
      console.error('Network error:', error.message);
      toast.error('Cannot connect to server. Please check your network.');
    } else {
      // Other errors - show user-friendly message
      toast.error(userMessage);
    }

    return Promise.reject(error);
  }
);

/**
 * Helper function to extract message from API error
 */
export interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
}

export const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const apiError = error as ApiErrorResponse;
    return apiError.response?.data?.message || defaultMessage;
  }
  return defaultMessage;
};

export const isUnauthorizedError = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'response' in error) {
    const apiError = error as ApiErrorResponse;
    return apiError.response?.status === 401;
  }
  return false;
};

export default apiClient;
