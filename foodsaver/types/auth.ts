export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'restaurant' | 'admin';
  phone?: string;
   restaurantName?: string;
  restaurantAddress?: string;
  googleMapsLink?: string;
}

export interface AuthResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  errors?: Array<{ msg: string }>;
}

export interface AuthLoginResponse {
  user: AuthUser;
  token: string;
}

export interface SignUpData {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'restaurant';
  phone?: string;
   restaurantName?: string;
  restaurantAddress?: string;
  googleMapsLink?: string;
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
