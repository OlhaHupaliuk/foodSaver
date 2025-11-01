import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Mail, Lock, User as UserIcon, Phone, WifiOff, AlertCircle } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { AuthErrorType } from '../../types/auth';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [localError, setLocalError] = useState('');
  const { signUp, loading: authLoading, error: authError, clearError } = useAuth();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    if (!phone) return true; // Телефон необов'язковий
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return phoneRegex.test(phone);
  };

  const handleSignUp = async () => {
    setLocalError('');

    if (!email || !password || !fullName) {
      setLocalError('Будь ласка, заповніть усі обов\'язкові поля');
      return;
    }

    if (!validateEmail(email)) {
      setLocalError('Введіть коректну email адресу');
      return;
    }

    if (password.length < 6) {
      setLocalError('Пароль повинен містити мінімум 6 символів');
      return;
    }

    if (phone && !validatePhone(phone)) {
      setLocalError('Введіть коректний номер телефону');
      return;
    }

    try {
      clearError();
      
      await signUp({
        name: fullName,
        email,
        password,
        phone: phone || undefined,
      });

      router.replace('/(tabs)');
    } catch (err: any) {
      console.log('Sign up error:', err);
    }
  };

  const getErrorMessage = () => {
    if (localError) return localError;
    if (!authError) return '';
    if (authError.type) return authError.message;
  };

  const errorMessage = getErrorMessage();
  const isNetworkError = authError?.type === AuthErrorType.NETWORK_ERROR;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>Реєстрація</Text>
          <Text style={styles.subtitle}>Створіть новий акаунт</Text>

          {errorMessage ? (
            <View style={[styles.errorContainer, isNetworkError && styles.errorContainerWarning]}>
              <View style={styles.errorIconWrapper}>
                {isNetworkError ? (
                  <WifiOff size={20} color="#ef4444" />
                ) : (
                  <AlertCircle size={20} color="#ef4444" />
                )}
              </View>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <TouchableOpacity onPress={clearError} style={styles.errorClose}>
                <Text style={styles.errorCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <UserIcon size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Повне ім'я *"
                value={fullName}
                placeholderTextColor="#9ca3af"
                onChangeText={setFullName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Mail size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email *"
                value={email}
                placeholderTextColor="#9ca3af"
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Phone size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Телефон (необов'язково)"
                value={phone}
                placeholderTextColor="#9ca3af"
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Пароль (мінімум 6 символів) *"
                value={password}
                placeholderTextColor="#9ca3af"
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.button, authLoading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={authLoading}
            >
              <Text style={styles.buttonText}>
                {authLoading ? 'Реєстрація...' : 'Зареєструватися'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/(auth)/signin')}>
              <Text style={styles.linkText}>
                Вже є акаунт? <Text style={styles.linkTextBold}>Увійти</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
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
});
