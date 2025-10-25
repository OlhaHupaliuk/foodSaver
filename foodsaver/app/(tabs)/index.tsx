import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { MapPin, Clock, Percent } from 'lucide-react-native';
import { formatPrice } from '../../utils/format';
import { getTimeUntilExpiry } from '../../utils/discount';
import { router } from 'expo-router';

export default function HomeScreen() {
  const [foodItems, setFoodItems] = useState<any[]>([]);

  const profile = {email: '', name:'', user_type:'restaurant', phone: '' };

  useEffect(() => {
    loadFoodItems();
  }, []);

  const loadFoodItems = async () => {
    
  };

  const isRestaurant = profile?.user_type === 'restaurant';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>FoodSaver</Text>
        <Text style={styles.subtitle}>
          {isRestaurant ? 'Керуйте залишками їжі' : 'Рятуйте їжу, економте гроші'}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {isRestaurant ? (
          <View style={styles.restaurantDashboard}>
            <Text style={styles.sectionTitle}>Швидкий старт</Text>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/manage')}
            >
              <Text style={styles.actionTitle}>Додати нову страву</Text>
              <Text style={styles.actionSubtitle}>Виставте залишки зі знижкою</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.foodList}>
            <Text style={styles.sectionTitle}>Найближчі </Text>
            {foodItems.map((item) => (
              <TouchableOpacity key={item.id} style={styles.foodCard}>
                <Image
                  source={{ uri: item.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg' }}
                  style={styles.foodImage}
                />
                <View style={styles.foodInfo}>
                  <Text style={styles.foodTitle}>{item.title}</Text>
                  <View style={styles.restaurantInfo}>
                    <MapPin size={14} color="#6b7280" />
                    <Text style={styles.restaurantName}>{item.restaurant?.name}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <View style={styles.priceContainer}>
                      <Text style={styles.originalPrice}>{formatPrice(item.original_price)}</Text>
                      <Text style={styles.discountPrice}>{formatPrice(item.discount_price)}</Text>
                    </View>
                    <View style={styles.timeContainer}>
                      <Clock size={14} color="#ef4444" />
                      <Text style={styles.timeText}>{getTimeUntilExpiry(item.expiry_time)}</Text>
                    </View>
                  </View>
                  <View style={styles.discountBadge}>
                    <Percent size={12} color="#ffffff" />
                    <Text style={styles.discountText}>
                      {Math.round((1 - item.discount_price / item.original_price) * 100)}%
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#10b981',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#d1fae5',
  },
  content: {
    flex: 1,
  },
  restaurantDashboard: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#10b981',
    borderStyle: 'dashed',
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  foodList: {
    padding: 20,
  },
  foodCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  foodImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#e5e7eb',
  },
  foodInfo: {
    padding: 16,
  },
  foodTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  discountPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeText: {
    fontSize: 12,
    color: '#ef4444',
    marginLeft: 4,
    fontWeight: '600',
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
});
