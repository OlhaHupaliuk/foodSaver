import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Mail, Lock, AlertCircle, WifiOff, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { AuthErrorType } from '../../types/auth';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  
  const { signIn, loading: authLoading, error: authError, clearError } = useAuth();

  useEffect(() => {
    return () => {
      clearError();
    };
  }, []);

  const getErrorMessage = () => {
    if (localError) return localError;
    if (!authError) return '';

    if (authError.type) {
        return authError.message;
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignIn = async () => {
    setLocalError('');

    if (!email || !password) {
      setLocalError('Будь ласка, заповніть усі поля');
      return;
    }

    if (!validateEmail(email)) {
      setLocalError('Введіть коректна email адреса');
      return;
    }

    if (password.length < 6) {
      setLocalError('Пароль повинен містити мінімум 6 символів');
      return;
    }

    try {
      clearError();
      await signIn(email, password);
      
      console.log('Redirecting to main app');
      router.replace('/(tabs)');
    } catch (err: any) {
      console.log('Sign in error caught:', err);
    }
  };

  const errorMessage = getErrorMessage();
  const isNetworkError = authError?.type === AuthErrorType.NETWORK_ERROR;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft size={24} color="#111827" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Вхід</Text>
        <Text style={styles.subtitle}>Ласкаво просимо назад!</Text>

        {errorMessage ? (
          <View style={[
            styles.errorContainer,
            isNetworkError && styles.errorContainerWarning
          ]}>
            <View style={styles.errorIconWrapper}>
              {isNetworkError ? (
                <WifiOff size={20} color="#ef4444" />
              ) : (
                <AlertCircle size={20} color="#ef4444" />
              )}
            </View>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity
              onPress={clearError}
              style={styles.errorClose}
            >
              <Text style={styles.errorCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Mail size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setLocalError('');
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!authLoading}
              placeholderTextColor="#d1d5db"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Пароль"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setLocalError('');
              }}
              secureTextEntry={!showPassword}
              editable={!authLoading}
              placeholderTextColor="#d1d5db"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              {showPassword ? (
                <Eye size={20} color="#9ca3af" />
              ) : (
                <EyeOff size={20} color="#9ca3af" />
              )}
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.button, authLoading && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={authLoading}
          >
            {authLoading ? (
              <ActivityIndicator color="#ffffff" size="large" />
            ) : (
              <Text style={styles.buttonText}>Увійти</Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <TouchableOpacity 
            onPress={() => router.push('/(auth)/signup')} 
            disabled={authLoading}
            style={{ opacity: authLoading ? 0.5 : 1 }}
          >
            <Text style={styles.linkText}>
              Немає акаунту? <Text style={styles.linkTextBold}>Зареєструватися</Text>
            </Text>
          </TouchableOpacity>

          {__DEV__ && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>Debug Info:</Text>
              <Text style={styles.debugText}>Loading: {authLoading.toString()}</Text>
              {authError && (
                <Text style={styles.debugText}>Error Type: {authError.type}</Text>
              )}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 120,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
  },
  errorContainer: {
    flexDirection: 'row',
    backgroundColor: '#fee2e2',
    padding: 12,
    paddingLeft: 14,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorContainerWarning: {
    backgroundColor: '#fef3c7',
    borderLeftColor: '#f59e0b',
  },
  errorIconWrapper: {
    marginRight: 10,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  errorClose: {
    padding: 4,
    marginLeft: 8,
  },
  errorCloseText: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: 'bold',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111827',
  },
  eyeIcon: {
    padding: 8,
    marginRight: -8,
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  linkText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  linkTextBold: {
    fontWeight: '600',
    color: '#10b981',
  },
  debugInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  debugText: {
    fontSize: 12,
    color: '#166534',
    fontFamily: 'monospace',
  },
});
