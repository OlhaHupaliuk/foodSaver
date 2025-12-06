import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Leaf } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function WelcomeScreen() {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={[styles.logo, { backgroundColor: theme.colors.surfaceSecondary, shadowColor: theme.colors.shadowPrimary }]}>
            <Leaf size={64} color={theme.colors.primary} />
          </View>
          <Text style={[styles.appName, { color: theme.colors.text }]}>FoodSaver</Text>
          <Text style={[styles.tagline, { color: theme.colors.textSecondary }]}>Рятуйте їжу. Економте гроші.</Text>
        </View>

        <View style={styles.features}>
          <Text style={[styles.featureText, { color: theme.colors.text }]}>До 70% знижки на якісну їжу</Text>
          <Text style={[styles.featureText, { color: theme.colors.text }]}>Зменшуйте харчові відходи</Text>
          <Text style={[styles.featureText, { color: theme.colors.text }]}>Підтримуйте місцевий бізнес</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.shadowPrimary }]}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.primaryButtonText}>Почати</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/(auth)/signin')}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.colors.textSecondary }]}>Вже є акаунт</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.4,
    shadowRadius: 50,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
  },
  features: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: 16,
    textAlign: 'center',
  },
  actions: {
    padding: 24,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '500',
  },
});
