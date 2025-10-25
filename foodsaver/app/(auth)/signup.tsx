import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Mail, Lock, User as UserIcon, Store,WifiOff ,AlertCircle} from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { AuthErrorType } from '../../types/auth';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState<'user' | 'restaurant'>('user');
  const [localError, setLocalError] = useState('');
  const { signUp, loading: authLoading, error: authError, clearError } = useAuth();

    
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignUp = async () => {    
    setLocalError('');

    if (!email || !password) {
      setLocalError('Будь ласка, заповніть усі поля');
      return;
    }

    if (!validateEmail(email)) {
      setLocalError('Введіть коректну email адресу');
      return;
    }

    if (!email || !password || !fullName) {
      setLocalError('Будь ласка, заповніть усі поля');
      return;
    }

    if (password.length < 6) {
      setLocalError('Пароль повинен містити мінімум 6 символів');
      return;
    }
    try {
      clearError();
      await signUp({name: fullName, email, password, role:'user'});
      
      console.log('Redirecting to main app');
      router.replace('/(tabs)');
    } catch (err: any) {
      console.log('Sign in error caught:', err);
    }
  };

    const getErrorMessage = () => {
    if (localError) return localError;
    if (!authError) return '';

    if (authError.type) {
        return authError.message;
    }
  };
    const errorMessage = getErrorMessage();
    const isNetworkError = authError?.type === AuthErrorType.NETWORK_ERROR;
  

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft size={24} color="#111827" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Реєстрація</Text>
        <Text style={styles.subtitle}>Створіть новий акаунт</Text>

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
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeButton, userType === 'user' && styles.typeButtonActive]}
              onPress={() => setUserType('user')}
            >
              <UserIcon size={24} color={userType === 'user' ? '#ffffff' : '#6b7280'} />
              <Text style={[styles.typeButtonText, userType === 'user' && styles.typeButtonTextActive]}>
                Споживач
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeButton, userType === 'restaurant' && styles.typeButtonActive]}
              onPress={() => setUserType('restaurant')}
            >
              <Store size={24} color={userType === 'restaurant' ? '#ffffff' : '#6b7280'} />
              <Text style={[styles.typeButtonText, userType === 'restaurant' && styles.typeButtonTextActive]}>
                Ресторан
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <UserIcon size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Повне ім'я"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Mail size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Пароль (мінімум 6 символів)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.button]}
            onPress={handleSignUp}
          >
            <Text style={styles.buttonText}>
              Зареєструватися
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/signin')}>
            <Text style={styles.linkText}>
              Вже є акаунт? <Text style={styles.linkTextBold}>Увійти</Text>
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
    flex: 1,
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
  errorText: {
    backgroundColor: '#fee2e2',
    color: '#ef4444',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
  },
  form: {
    gap: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    padding: 16,
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  typeButtonTextActive: {
    color: '#ffffff',
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
  errorClose: {
    padding: 4,
    marginLeft: 8,
  },
  errorCloseText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  eyeIcon: {
    padding: 8,
    marginRight: -8,
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
