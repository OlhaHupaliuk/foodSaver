import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, AuthLoginResponse, GetMeResponse, AuthUser, AuthError, AuthErrorType, FoodItem } from '../types/auth';

const API_URL = 'http://192.168.0.103:5000/api';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

const parseError = (error: any): AuthError => {
  // Network error
  if (error.message === 'Network request failed' || error instanceof TypeError) {
    return {
      type: AuthErrorType.NETWORK_ERROR,
      message: 'Помилка мережі. Переконайтеся що сервер запущен та доступний.',
      details: error.message,
    };
  }

  // API error response
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    if (status === 401) {
      return {
        type: AuthErrorType.INVALID_CREDENTIALS,
        message: data?.message || 'Невірний email або пароль',
        statusCode: 401,
      };
    }

    if (status === 400) {
      return {
        type: AuthErrorType.VALIDATION_ERROR,
        message: data?.message || 'Помилка валідації даних',
        details: data?.errors,
        statusCode: 400,
      };
    }

    if (status === 409) {
      return {
        type: AuthErrorType.USER_EXISTS,
        message: 'Користувач з таким email уже існує',
        statusCode: 409,
      };
    }

    if (status === 500) {
      return {
        type: AuthErrorType.SERVER_ERROR,
        message: 'Помилка сервера. Спробуйте пізніше.',
        statusCode: 500,
      };
    }
  }

  // Unknown error
  return {
    type: AuthErrorType.UNKNOWN,
    message: error.message || 'Невідома помилка. Спробуйте пізніше.',
    details: error,
  };
};

export const api = {
  async request<T>(endpoint: string, options: FetchOptions = {}): Promise<AuthResponse<T>> {
    const { skipAuth = false, ...fetchOptions } = options;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    if (!skipAuth) {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    try {
      const url = `${API_URL}${endpoint}`;
      console.log('🔗 API Request:', url);

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ API Error:', response.status, data);
        throw new Error(data.message || `API Error: ${response.status}`);
      }

      console.log('✅ API Success:', endpoint);
      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  },

  auth: {
    register: (data: any) =>
      api.request<AuthLoginResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
        skipAuth: true,
      }),

    login: (email: string, password: string) =>
      api.request<AuthLoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        skipAuth: true,
      }),

    getMe: () =>
      api.request<GetMeResponse>('/auth/me', {
        method: 'GET',
      }),

    updateProfile: (data: any) =>
      api.request<AuthUser>('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  restaurants: {
    getAll: (params?: { longitude?: number; latitude?: number; maxDistance?: number }) => {
      const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
      return api.request(`/restaurants${queryString}`, {
        method: 'GET',
      });
    },

    getById: (id: string) =>
      api.request(`/restaurants/${id}`, {
        method: 'GET',
      }),

    create: (data: any) =>
      api.request('/restaurants', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      api.request(`/restaurants/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  foodItems: {
    getAll: (params?: { restaurant?: string; category?: string; maxPrice?: number }) => {
      const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
      return api.request(`/food-items${queryString}`, {
        method: 'GET',
      });
    },

    getById: (id: string) =>
      api.request(`/food-items/${id}`, {
        method: 'GET',
      }),

    getByRestaurant: (restaurantId: string) =>
      api.request<FoodItem[]>(`/food-items/by-restaurant/${restaurantId}`, {
        method: 'GET',
      }),

    create: (data: any) =>
      api.request('/food-items', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      api.request(`/food-items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      api.request(`/food-items/${id}`, {
        method: 'DELETE',
      }),
  },

  orders: {
    getAll: () =>
      api.request('/orders', {
        method: 'GET',
      }),

    getById: (id: string) =>
      api.request(`/orders/${id}`, {
        method: 'GET',
      }),

    create: (data: any) =>
      api.request('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateStatus: (id: string, status: string) =>
      api.request(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),

    cancel: (id: string) =>
      api.request(`/orders/${id}`, {
        method: 'DELETE',
      }),
  },
};
