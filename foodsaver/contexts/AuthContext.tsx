import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AuthUser, AuthError } from '../types/auth';

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: AuthError | null;
  signUp: (data: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
