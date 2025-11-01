import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { AuthUser, SignUpData, AuthError, AuthErrorType } from '../types/auth';

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const savedToken = await AsyncStorage.getItem('authToken');

      if (savedToken) {
        setToken(savedToken);
        try {
          const response = await api.auth.getMe();
          if (response.status === 'success' && response.data?.user) {
            setUser(response.data.user);
          }
        } catch (err: any) {
          console.log('Failed to fetch user:', err.message);
          
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('authUser');
          setToken(null);
          setUser(null);

          setError({
            type: AuthErrorType.UNAUTHORIZED,
            message: 'Сеанс закінчився. Будь ласка, увійдіть знову.',
          });
        }
      }
    } catch (err: any) {
      console.error('Bootstrap error:', err);
      setError({
        type: AuthErrorType.UNKNOWN,
        message: 'Помилка при завантаженні. Спробуйте перезагрузити додаток.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (data: SignUpData) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Signing up with:', data.email);

      const response = await api.auth.register({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
      });

      if (response.status === 'success' && response.data) {
        const { user, token } = response.data;

        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('authUser', JSON.stringify(user));

        setToken(token);
        setUser(user);

        console.log('Sign up successful');
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Registration failed';
      console.error('Sign up error:', errorMessage);

      let authError: AuthError;

      if (errorMessage.includes('already exists')) {
        authError = {
          type: AuthErrorType.USER_EXISTS,
          message: 'Користувач з таким email уже зареєстрований',
          details: errorMessage,
        };
      } else if (errorMessage.includes('Network')) {
        authError = {
          type: AuthErrorType.NETWORK_ERROR,
          message: 'Помилка мережі. Перевірте підключення.',
          details: errorMessage,
        };
      } else if (errorMessage.includes('validation') || errorMessage.includes('valid')) {
        authError = {
          type: AuthErrorType.VALIDATION_ERROR,
          message: 'Перевірте введені дані. Пароль мінімум 6 символів.',
          details: errorMessage,
        };
      } else {
        authError = {
          type: AuthErrorType.SERVER_ERROR,
          message: errorMessage,
        };
      }

      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Signing in with:', email);

      const response = await api.auth.login(email, password);

      if (response.status === 'success' && response.data) {
        const { user, token } = response.data;

        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('authUser', JSON.stringify(user));

        setToken(token);
        setUser(user);

        console.log('Sign in successful for user:', user.id);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      console.error('Sign in error:', errorMessage);

      let authError: AuthError;

      // Обробка різних типів помилок
      if (errorMessage.includes('credentials') || errorMessage.includes('Invalid')) {
        authError = {
          type: AuthErrorType.INVALID_CREDENTIALS,
          message: 'Невірний email або пароль. Спробуйте знову.',
          details: errorMessage,
        };
      } else if (errorMessage.includes('Network') || errorMessage.includes('request failed')) {
        authError = {
          type: AuthErrorType.NETWORK_ERROR,
          message: 'Помилка мережи. Переконайтеся що сервер запущен та доступний.',
          details: errorMessage,
        };
      } else if (errorMessage.includes('500')) {
        authError = {
          type: AuthErrorType.SERVER_ERROR,
          message: 'Помилка сервера. Спробуйте пізніше.',
          details: errorMessage,
        };
      } else {
        authError = {
          type: AuthErrorType.UNKNOWN,
          message: errorMessage,
        };
      }

      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      console.log('👋 Signing out');

      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('authUser');

      setToken(null);
      setUser(null);
      setError(null);

      console.log('Sign out successful');
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError({
        type: AuthErrorType.UNKNOWN,
        message: 'Помилка при виході',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    token,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    clearError,
    isAuthenticated: !!token,
  };
};
