import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Mail, Lock, User as UserIcon, Store } from 'lucide-react-native';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState<'consumer' | 'restaurant'>('consumer');
  const [error, setError] = useState('');

  const handleSignUp = () => {
    if (!email || !password || !fullName) {
      setError('Будь ласка, заповніть усі поля');
      return;
    }

    if (password.length < 6) {
      setError('Пароль повинен містити мінімум 6 символів');
      return;
    }

  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft size={24} color="#111827" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Реєстрація</Text>
        <Text style={styles.subtitle}>Створіть новий акаунт</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.form}>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeButton, userType === 'consumer' && styles.typeButtonActive]}
              onPress={() => setUserType('consumer')}
            >
              <UserIcon size={24} color={userType === 'consumer' ? '#ffffff' : '#6b7280'} />
              <Text style={[styles.typeButtonText, userType === 'consumer' && styles.typeButtonTextActive]}>
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
});
