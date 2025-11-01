// types/auth.ts
export interface Restaurant {
  id: string;
  name: string;
  phone: string;
  address: string;
  googleMapsLink: string;
  description?: string;
  owner: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'restaurant_owner' | 'admin';
  restaurant?: Restaurant | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  errors?: Array<{ msg: string; path?: string; type?: string }>;
}

export interface AuthLoginResponse {
  user: AuthUser;
  token: string;
}

export interface SignUpData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface CreateRestaurantData {
  name: string;
  phone: string;
  address: string;
  googleMapsLink: string;
  description?: string;
  coordinates?: [number, number];
}

export interface GetMeResponse {
  user: AuthUser;
}

export enum AuthErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_EXISTS = 'USER_EXISTS',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  UNKNOWN = 'UNKNOWN',
}

export interface AuthError {
  type: AuthErrorType;
  message: string;
  details?: any;
  statusCode?: number;
}

export interface FoodItem {
  id: string;
  title: string;
  description: string;
  category?: string;
  originalPrice: number;
  discountedPrice: number;
  quantity: number;
  restaurant: Restaurant | string;
  isAvailable: boolean;
  expiryTime: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  user: string;
  foodItem: FoodItem;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
}
