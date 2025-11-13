import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, HelperText, ActivityIndicator } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { AuthErrorType } from '../../types/auth';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const { signIn, loading: authLoading, error: authError, clearError } = useAuth();

  useEffect(() => {
    return () => clearError();
  }, []);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSignIn = async () => {
    setLocalError('');

    if (!email || !password) {
      setLocalError('Будь ласка, заповніть усі поля');
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

    try {
      clearError();
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      console.log('Sign in error caught:', err);
    }
  };

  const errorMessage = localError || authError?.message || '';
  const isNetworkError = authError?.type === AuthErrorType.NETWORK_ERROR;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="arrow-left"
          size={28}
          color="#111827"
          onPress={() => router.back()}
        />
      </View>

      <View style={styles.content}>
        <Text variant="headlineLarge" style={styles.title}>Вхід</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>Ласкаво просимо назад!</Text>

        {errorMessage ? (
          <View
            style={[
              styles.errorContainer,
              isNetworkError && { backgroundColor: '#FEF3C7', borderLeftColor: '#F59E0B' },
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
            label="Email"
            mode="outlined"
            left={<TextInput.Icon icon="email-outline" />}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setLocalError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!authLoading}
            outlineColor="#e5e7eb"
            activeOutlineColor="#333" 
            textColor="#111827"
          />
          <HelperText type="error" visible={!!localError && !validateEmail(email)}>
            {email && !validateEmail(email) ? 'Некоректний email' : ''}
          </HelperText>

          <TextInput
            label="Пароль"
            mode="outlined"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setLocalError('');
            }}
            secureTextEntry={!showPassword}
            editable={!authLoading}
            left={<TextInput.Icon icon="lock-outline" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            outlineColor="#e5e7eb"
            activeOutlineColor="#333"
            textColor="#111827"
          />

          <Button
            mode="contained"
            onPress={handleSignIn}
            disabled={authLoading}
            style={styles.button}
            contentStyle={{ paddingVertical: 8 }}
            buttonColor="#10b981"
            textColor="#fff"
          >
            {authLoading ? (
              <ActivityIndicator animating={true} color="#fff" />
            ) : (
              'Увійти'
            )}
          </Button>

          <Button
            onPress={() => router.push('/(auth)/signup')}
            disabled={authLoading}
            style={{ marginTop: 12 }}
            textColor="#10b981"
          >
            Немає акаунту? Зареєструватися
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
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
    color: '#111827',
  },
  subtitle: {
    color: '#6B7280',
    marginBottom: 32,
  },
  form: {
    gap: 0,
  },
  button: {
    marginTop: 24,
    borderRadius: 12,
    shadowColor: '#10b981',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
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
