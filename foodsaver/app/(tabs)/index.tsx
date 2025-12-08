import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { MapPin, Clock, Percent, Star, RefreshCw } from 'lucide-react-native';
import { formatPrice } from '../../utils/format';
import { getTimeUntilExpiry } from '../../utils/discount';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { FoodItem } from '../../types/auth';
import { useOrderActions } from '../../hooks/useOrderActions';
import { useTheme } from '../../contexts/ThemeContext';

export default function HomeScreen() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  const { user } = useAuth();
  const { orderingItemId, confirmAndPlaceOrder } = useOrderActions();

  useEffect(() => {
    loadFoodItems();
  }, []);

  const loadFoodItems = async () => {
    try {
      setLoading(true);
      const response = await api.foodItems.getAll(); // або getNearby(user.location)
      if (response.status === 'success') {
        setFoodItems(response.data?.items ?? []);
      }
    } catch (error) {
      console.error('Error loading food items:', error);
    } finally {
      setLoading(false);
    }
  };

  const isRestaurant = user?.role === 'restaurant_owner';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <View>
          <Text style={[styles.title, { color: theme.colors.text }]}>FoodSaver</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {isRestaurant ? 'Керуйте залишками їжі' : 'Рятуйте їжу, економте гроші'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {isRestaurant ? (
          <View style={styles.restaurantDashboard}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Швидкий старт</Text>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}
              onPress={() => router.push('/(tabs)/manage')}
            >
              <Text style={[styles.actionTitle, { color: theme.colors.primaryAccent }]}>Додати нову страву</Text>
              <Text style={[styles.actionSubtitle, { color: theme.colors.textSecondary }]}>Виставте залишки зі знижкою</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.foodList}>
            <View style={styles.listHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Найближчі</Text>
              <TouchableOpacity
                onPress={loadFoodItems}
                disabled={loading}
                style={styles.refreshButton}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={theme.colors.primaryAccent} />
                ) : (
                  <RefreshCw size={18} color={theme.colors.primaryAccent} />
                )}
              </TouchableOpacity>
            </View>

            {foodItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Поки що немає доступних позицій поруч</Text>
                <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                  Поверніться трохи пізніше або перегляньте карту, щоб знайти заклади в інших районах.
                </Text>
              </View>
            ) : (
              foodItems.map((item, index) => (
                <TouchableOpacity
                  key={item.id || (item as any)._id || `food-item-${index}`}
                  style={[
                    styles.foodCard,
                    { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
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
                    style={[styles.foodImage, { backgroundColor: theme.colors.surfaceTertiary }]}
                  />
                  <View style={styles.foodInfo}>
                    <View style={styles.foodTitleRow}>
                      <Text style={[styles.foodTitle, { color: theme.colors.text }]}>{item.title}</Text>
                      {item.averageRating && item.averageRating > 0 && (
                        <View style={styles.foodRating}>
                          <Star size={14} color="#FBBF24" fill="#FBBF24" />
                          <Text style={[styles.foodRatingText, { color: theme.colors.text }]}>
                            {item.averageRating.toFixed(1)}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.restaurantInfo}>
                      <MapPin size={14} color={theme.colors.textSecondary} />
                      <Text style={[styles.restaurantName, { color: theme.colors.textSecondary }]}>
                        {typeof item.restaurant !== 'string' ? item.restaurant?.name : ''}
                      </Text>
                    </View>
                    <View style={styles.priceRow}>
                      <View style={styles.priceContainer}>
                        <Text style={[styles.originalPrice, { color: theme.colors.textTertiary }]}>{formatPrice(item.originalPrice)}</Text>
                        <Text style={[styles.discountPrice, { color: theme.colors.primaryAccent }]}>{formatPrice(item.discountedPrice)}</Text>
                      </View>
                      <View style={styles.timeContainer}>
                        <Clock size={14} color={theme.colors.errorLight} />
                        <Text style={[styles.timeText, { color: theme.colors.errorLight }]}>{getTimeUntilExpiry(item.expiryTime)}</Text>
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
  },
  header: {
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
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
    marginBottom: 12,
  },
  actionCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
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
  refreshButton: {
    padding: 8,
    borderRadius: 8,
  },
  foodCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A3E',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  foodImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#2A2A3E',
  },
  foodInfo: {
    padding: 16,
  },
  foodTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  foodTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  foodRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  foodRatingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 14,
    color: '#9CA3AF',
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
    color: '#6B7280',
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
    color: '#F87171',
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
    shadowColor: '#f97316',
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  disabledCard: {
    opacity: 0.5,
  },
  emptyState: {
    paddingVertical: 32,
    paddingHorizontal: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E5F0',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
});
