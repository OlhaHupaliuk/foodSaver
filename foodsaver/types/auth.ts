// types/auth.ts
export interface GeoLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

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
  location?: GeoLocation;
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
  location?: GeoLocation;
  imageBase64?: string;
  distance?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  user: string;
  restaurant: Restaurant | string;
  items: Array<{
    foodItem: FoodItem | string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  totalDiscount?: number;
  status: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled';
  pickupTime: string;
  createdAt?: string;
  updatedAt?: string;
}

// --- Restaurant statistics ---

export interface RestaurantStatsPoint {
  label: string; // e.g. 'Тиждень 1', 'Січ', '2025-01'
  orders: number;
  revenue: number;
  moneySaved: number;
}

export interface RestaurantStatsCharts {
  weekly: RestaurantStatsPoint[];
  monthly: RestaurantStatsPoint[];
}

export interface RestaurantStatsSummary {
  totalFoodSaved: number;
  totalMoneySaved: number;
  totalRevenue: number;
  totalOrders: number;
  averageRating: number | null;
}

export interface RestaurantStatisticsResponse {
  summary: RestaurantStatsSummary;
  charts: RestaurantStatsCharts;
}