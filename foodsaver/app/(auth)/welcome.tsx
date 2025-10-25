import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { Leaf } from 'lucide-react-native';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Leaf size={64} color="#10b981" />
          </View>
          <Text style={styles.appName}>FoodSaver</Text>
          <Text style={styles.tagline}>Рятуйте їжу. Економте гроші.</Text>
        </View>

        <Image
          source={{ uri: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg' }}
          style={styles.heroImage}
        />

        <View style={styles.features}>
          <Text style={styles.featureText}>До 70% знижки на якісну їжу</Text>
          <Text style={styles.featureText}>Зменшуйте харчові відходи</Text>
          <Text style={styles.featureText}>Підтримуйте місцевий бізнес</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.primaryButtonText}>Почати</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/(auth)/signin')}
        >
          <Text style={styles.secondaryButtonText}>Вже є акаунт</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#6b7280',
  },
  heroImage: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    marginBottom: 32,
  },
  features: {
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
  actions: {
    padding: 24,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
});
