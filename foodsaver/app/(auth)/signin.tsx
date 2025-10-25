import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Mail, Lock } from 'lucide-react-native';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('')

  const handleSignIn = () => {
    console.log(email, password);
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft size={24} color="#111827" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Вхід</Text>
        <Text style={styles.subtitle}>Ласкаво просимо назад!</Text>

        <View style={styles.form}>
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
              placeholder="Пароль"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.button]}
                      onPress={() => router.push('/(tabs)/explore')}
          >
            <Text style={styles.buttonText}>
              Увійти
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.linkText}>
              Немає акаунту? <Text style={styles.linkTextBold}>Зареєструватися</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
