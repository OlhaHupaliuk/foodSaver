import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { MapPin, Clock, Percent } from 'lucide-react-native';
import { formatPrice } from '../../utils/format';
import { getTimeUntilExpiry } from '../../utils/discount';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { FoodItem } from '../../types/auth';
import { useOrderActions } from '../../hooks/useOrderActions';

export default function HomeScreen() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);

  const { user } = useAuth();
  const { orderingItemId, confirmAndPlaceOrder } = useOrderActions();

  useEffect(() => {
    loadFoodItems();
  }, []);

  const loadFoodItems = async () => {
    try {
      const response = await api.foodItems.getAll(); // або getNearby(user.location)
      if (response.status === 'success') {
        setFoodItems(response.data?.items ?? []);
      }
    } catch (error) {
      console.error('Error loading food items:', error);
    }
  };

  const isRestaurant = user?.role === 'restaurant_owner';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>FoodSaver</Text>
          <Text style={styles.subtitle}>
            {isRestaurant ? 'Керуйте залишками їжі' : 'Рятуйте їжу, економте гроші'}
          </Text>
        </View>
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
            <View style={styles.listHeaderRow}>
              <Text style={styles.sectionTitle}>Найближчі</Text>
            </View>

            {foodItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Поки що немає доступних позицій поруч</Text>
                <Text style={styles.emptySubtitle}>
                  Поверніться трохи пізніше або перегляньте карту, щоб знайти заклади в інших районах.
                </Text>
              </View>
            ) : (
              foodItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.foodCard,
                    (!item.isAvailable || orderingItemId === item.id) && styles.disabledCard,
                  ]}
                  onPress={() => confirmAndPlaceOrder(item)}
                  disabled={!item.isAvailable || orderingItemId === item.id}
                >
                  <Image
                    source={{
                      uri: item.imageBase64
                      ? `data:image/jpeg;base64,${item.imageBase64}`
                      : 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'
                    
                    }}
                    style={styles.foodImage}
                  />
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodTitle}>{item.title}</Text>
                    <View style={styles.restaurantInfo}>
                      <MapPin size={14} color="#6b7280" />
                      <Text style={styles.restaurantName}>
                        {typeof item.restaurant !== 'string' ? item.restaurant?.name : ''}
                      </Text>
                    </View>
                    <View style={styles.priceRow}>
                      <View style={styles.priceContainer}>
                        <Text style={styles.originalPrice}>{formatPrice(item.originalPrice)}</Text>
                        <Text style={styles.discountPrice}>{formatPrice(item.discountedPrice)}</Text>
                      </View>
                      <View style={styles.timeContainer}>
                        <Clock size={14} color="#ef4444" />
                        <Text style={styles.timeText}>{getTimeUntilExpiry(item.expiryTime)}</Text>
                      </View>
                    </View>
                    <View style={styles.discountBadge}>
                      <Percent size={12} color="#ffffff" />
                      <Text style={styles.discountText}>
                        {Math.round(
                          (1 - (item.discountedPrice ?? 0) / (item.originalPrice || 1)) * 100
                        )}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
  },
  restaurantDashboard: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  foodCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
    backgroundColor: '#f97316',
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
  disabledCard: {
    opacity: 0.6,
  },
  emptyState: {
    paddingVertical: 32,
    paddingHorizontal: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});
