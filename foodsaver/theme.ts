// Dark theme colors
export const theme = {
  colors: {
    // Background colors
    background: '#0A0A0F',
    surface: '#151520',
    surfaceSecondary: '#1A1A2E',
    surfaceTertiary: '#2A2A3E',
    
    // Text colors
    text: '#E5E5F0',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',
    
    // Primary colors
    primary: '#1B7F5F',
    primaryDark: '#059669',
    primaryLight: '#34D399',
    primaryAccent: '#10b981',
    
    // Secondary colors
    secondary: '#F59E0B',
    secondaryDark: '#D97706',
    secondaryLight: '#FBBF24',
    
    // Status colors
    error: '#EF4444',
    errorLight: '#F87171',
    errorBackground: '#2A1A1A',
    warning: '#F59E0B',
    success: '#10b981',
    
    // Border colors
    border: '#2A2A3E',
    borderLight: '#1B7F5F',
    
    // Shadow colors
    shadow: '#000',
    shadowPrimary: '#1B7F5F',
    
    // Other
    white: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.8)',
  },
};

export type Theme = typeof theme;

