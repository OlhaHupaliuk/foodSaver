import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  ActivityIndicator,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { AuthErrorType } from '../../types/auth';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [localError, setLocalError] = useState('');

  const { signUp, loading: authLoading, error: authError, clearError } = useAuth();

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePhone = (phone: string) => {
    if (!phone) return true;
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return phoneRegex.test(phone);
  };

  const handleSignUp = async () => {
    setLocalError('');

    if (!email || !password || !fullName) {
      setLocalError("Будь ласка, заповніть усі обов'язкові поля");
      return;
    }

    if (!validateEmail(email)) {
      setLocalError('Введіть коректний email');
      return;
    }

    if (password.length < 6) {
      setLocalError('Пароль повинен містити мінімум 6 символів');
      return;
    }

    if (!validatePhone(phone)) {
      setLocalError('Некоректний номер телефону');
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
    } catch (err) {
      console.log('Sign up error:', err);
    }
  };

  const errorMessage = localError || authError?.message || '';
  const isNetworkError = authError?.type === AuthErrorType.NETWORK_ERROR;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.backButton}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={28}
            color="#333"
            onPress={() => router.back()}
          />
        </View>

        <View style={styles.content}>
          <Text variant="headlineLarge" style={styles.title}>
            Реєстрація
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Створіть новий акаунт
          </Text>

          {/* Error */}
          {errorMessage ? (
            <View
              style={[
                styles.errorContainer,
                isNetworkError && {
                  backgroundColor: '#FEF3C7',
                  borderLeftColor: '#F59E0B',
                },
              ]}
            >
              <MaterialCommunityIcons
                name={isNetworkError ? 'wifi-off' : 'alert-circle-outline'}
                size={20}
                color="#EF4444"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.errorText}>{errorMessage}</Text>
              <MaterialCommunityIcons
                name="close"
                size={20}
                color="#EF4444"
                onPress={clearError}
              />
            </View>
          ) : null}

          <View style={styles.form}>
            <TextInput
              label="Повне ім'я *"
              mode="outlined"
              left={<TextInput.Icon icon="account-outline" />}
              value={fullName}
              activeOutlineColor="#6b6b6bff" 
              onChangeText={(t) => {
                setFullName(t);
                setLocalError('');
              }}
            />

            {/* Email */}
            <TextInput
              label="Email *"
              mode="outlined"
              left={<TextInput.Icon icon="email-outline" />}
              activeOutlineColor="#6b6b6bff" 
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setLocalError('');
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              label="Телефон (необов'язково)"
              mode="outlined" 
              activeOutlineColor="#6b6b6bff" 
              left={<TextInput.Icon icon="phone-outline" />}
              value={phone}
              onChangeText={(t) => {
                setPhone(t);
                setLocalError('');
              }}
              keyboardType="phone-pad"
            />

            <TextInput
              label="Пароль *"
              mode="outlined"
              left={<TextInput.Icon icon="lock-outline" />}
              secureTextEntry
              value={password}    
              activeOutlineColor="#6b6b6bff" 
              onChangeText={(t) => {
                setPassword(t);
                setLocalError('');
              }}
            />

            <Button
              mode="contained"
              onPress={handleSignUp}
              disabled={authLoading}
              style={styles.button}
              contentStyle={{ paddingVertical: 10 }}
            >
              {authLoading ? (
                <ActivityIndicator animating color="#fff" />
              ) : (
                'Зареєструватися'
              )}
            </Button>

            <Button
              onPress={() => router.push('/(auth)/signin')}
              disabled={authLoading}
              textColor="#10b981"
              style={{ marginTop: 12 }}
            >
              Вже є акаунт? Увійти
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  scrollView: { flex: 1 },

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
    fontWeight: 'bold',
    marginBottom: 8,
  },

  subtitle: {
    color: '#6B7280',
    marginBottom: 32,
  },

  form: {
    gap: 16,
  },

  button: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: '#10b981',
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },

  errorText: {
    color: '#EF4444',
    flex: 1,
    fontSize: 13,
  },
});
