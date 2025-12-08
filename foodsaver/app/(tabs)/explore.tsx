import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Image, Modal, Alert } from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import { useEffect, useMemo, useState } from 'react';
import { formatPrice } from '../../utils/format';
import { getTimeUntilExpiry } from '../../utils/discount';
import { api } from '../../services/api';
import { FoodItem } from '../../types/auth';
import { getDefaultCoordinates, getUserLocation } from '../../services/location';
import { useOrderActions } from '../../hooks/useOrderActions';
import { useAuth } from '../../hooks/useAuth';
import { MapPin, Clock, Percent, ShoppingBag, ChevronUp, ChevronDown, Star } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

const DEFAULT_REGION_DELTA = 0.05;

function coordinatesFromItem(item: FoodItem) {
  const coords =
    item.location?.coordinates ||
    (typeof item.restaurant !== 'string'
      ? item.restaurant?.location?.coordinates
      : undefined);

  if (!coords || coords.length < 2) {
    return null;
  }

  const [longitude, latitude] = coords;
  return { latitude, longitude };
}

export default function ExploreScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [region, setRegion] = useState<Region>(() => {
    const coords = getDefaultCoordinates();
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: DEFAULT_REGION_DELTA,
      longitudeDelta: DEFAULT_REGION_DELTA,
    };
  });
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number | null>(null);
  const [isBottomSheetCollapsed, setIsBottomSheetCollapsed] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState<FoodItem | null>(null);
  const { orderingItemId, placeOrder } = useOrderActions();
  
  // Restaurant owners cannot place orders
  const canPlaceOrder = user?.role !== 'restaurant_owner';
  
  const toggleBottomSheet = () => {
    setIsBottomSheetCollapsed(!isBottomSheetCollapsed);
  };

  const handleOrderConfirm = async () => {
    if (!selectedOrderItem) return;
    
    setOrderModalVisible(false);
    await placeOrder(selectedOrderItem, {
      onSuccess: () => {
        setSelectedOrderItem(null);
      }
    });
  };

  useEffect(() => {
    (async () => {
      const locationResult = await getUserLocation();
      if (locationResult.coords) {
        const { latitude, longitude } = locationResult.coords;
        setUserCoords({ latitude, longitude });
        setRegion((prev) => ({
          ...prev,
          latitude,
          longitude,
        }));
      }
      if (locationResult.error) {
        setLocationError(locationResult.error);
      }
      setLoadingLocation(false);
    })();

    loadFoodItems();
  }, []);

  const loadFoodItems = async () => {
    try {
      setLoadingItems(true);
      const response = await api.foodItems.getAll();
      if (response.status === 'success') {
        const items = response.data?.items ?? [];
        
        // Load average ratings for each food item
        const itemsWithRatings = await Promise.all(
          items.map(async (item: FoodItem) => {
            // Use item.id or item._id, and check if it exists
            const itemId = item.id || (item as any)._id;
            if (!itemId) {
              // If no ID, return item as-is (might already have averageRating from backend)
              return item;
            }
            
            try {
              const reviewResponse = await api.reviews.getByFoodItem(itemId);
              if (reviewResponse.status === 'success' && reviewResponse.data) {
                const avgRating = (reviewResponse.data as any).averageRating || 0;
                return { ...item, averageRating: avgRating > 0 ? avgRating : undefined };
              }
            } catch (error) {
              // If review fetch fails, just continue without rating
              // Item might already have averageRating from backend response
            }
            return item;
          })
        );
        
        setFoodItems(itemsWithRatings);
      }
    } catch (error) {
      console.error('Error loading food items for map:', error);
    } finally {
      setLoadingItems(false);
    }
  };

  const getDistanceKm = (item: FoodItem) => {
    if (!userCoords) return null;
    const coord = coordinatesFromItem(item);
    if (!coord) return null;

    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(coord.latitude - userCoords.latitude);
    const dLon = toRad(coord.longitude - userCoords.longitude);
    const lat1 = toRad(userCoords.latitude);
    const lat2 = toRad(coord.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const availableItems = useMemo(() => {
    return foodItems
      .filter((item) => item.isAvailable && coordinatesFromItem(item))
      .filter((item) => {
        if (maxPrice != null && (item.discountedPrice ?? item.originalPrice) > maxPrice) {
          return false;
        }

        if (maxDistanceKm != null) {
          const distance = getDistanceKm(item);
          if (distance == null || distance > maxDistanceKm) {
            return false;
          }
        }

        return true;
      });
  }, [foodItems, maxPrice, maxDistanceKm, userCoords]);

  const isRestaurant = user?.role === 'restaurant_owner';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {(loadingLocation || loadingItems) && (
        <View style={[styles.loadingOverlay, { backgroundColor: theme.colors.background + 'E6' }]}>
          <ActivityIndicator size="large" color={theme.colors.primaryAccent} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Завантажуємо доступні позиції...</Text>
        </View>
      )}

      <MapView
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        loadingEnabled
      >
        {availableItems
          .filter((item) => coordinatesFromItem(item) !== null)
          .map((item, index) => {
            const coordinate = coordinatesFromItem(item)!; // Non-null assertion since we filtered

            return (
              <Marker
                key={item.id || (item as any)._id || `marker-${index}`}
                coordinate={coordinate}
                pinColor="#10b981"
                tracksViewChanges={false}
              >
              <Callout tooltip>
                <View style={[styles.callout, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}>
                  {item.imageBase64 && (
                    <Image
                      source={{
                        uri: `data:image/jpeg;base64,${item.imageBase64}`
                      }}
                      style={[styles.calloutImage, { backgroundColor: theme.colors.surfaceTertiary }]}
                    />
                  )}
                  <View style={styles.calloutContent}>
                    <View style={styles.calloutTitleRow}>
                      <Text style={[styles.calloutTitle, { color: theme.colors.text }]}>{item.title}</Text>
                      {item.averageRating && item.averageRating > 0 && (
                        <View style={styles.calloutRating}>
                          <Star size={12} color="#FBBF24" fill="#FBBF24" />
                          <Text style={[styles.calloutRatingText, { color: theme.colors.text }]}>
                            {item.averageRating.toFixed(1)}
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    {item.description && (
                      <Text style={[styles.calloutDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                        {item.description}
                      </Text>
                    )}
                    
                    {typeof item.restaurant !== 'string' && item.restaurant?.name && (
                      <View style={styles.calloutRestaurantRow}>
                        <MapPin size={12} color={theme.colors.textSecondary} />
                        <Text style={[styles.calloutRestaurant, { color: theme.colors.textSecondary }]}>
                          {item.restaurant.name}
                        </Text>
                      </View>
                    )}
                    
                    <View style={styles.calloutPriceRow}>
                      <View style={styles.calloutPriceContainer}>
                        <Text style={[styles.calloutOriginalPrice, { color: theme.colors.textTertiary }]}>
                          {formatPrice(item.originalPrice)}
                        </Text>
                        <Text style={[styles.calloutDiscountPrice, { color: theme.colors.primaryAccent }]}>
                          {formatPrice(item.discountedPrice)}
                        </Text>
                      </View>
                      <View style={[styles.calloutDiscountBadge, { backgroundColor: '#f97316' }]}>
                        <Percent size={10} color="#ffffff" />
                        <Text style={styles.calloutDiscountText}>
                          {Math.round(
                            (1 - (item.discountedPrice ?? 0) / (item.originalPrice || 1)) * 100
                          )}%
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.calloutInfoRow}>
                      <View style={styles.calloutTimeRow}>
                        <Clock size={12} color={theme.colors.errorLight} />
                        <Text style={[styles.calloutTimeText, { color: theme.colors.errorLight }]}>
                          {getTimeUntilExpiry(item.expiryTime)}
                        </Text>
                      </View>
                      {item.quantity > 0 && (
                        <Text style={[styles.calloutQuantity, { color: theme.colors.textSecondary }]}>
                          Залишилось: {item.quantity}
                        </Text>
                      )}
                    </View>
                    
                    {canPlaceOrder && item.isAvailable && (
                      <TouchableOpacity
                        style={[styles.calloutOrderButton, { backgroundColor: theme.colors.primaryAccent }]}
                        onPress={(e) => {
                          e.stopPropagation();
                          // Small delay to prevent callout from closing before modal opens
                          setTimeout(() => {
                            setSelectedOrderItem(item);
                            setOrderModalVisible(true);
                          }, 100);
                        }}
                        disabled={orderingItemId === item.id}
                      >
                        {orderingItemId === item.id ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <>
                            <ShoppingBag size={16} color="#ffffff" />
                            <Text style={styles.calloutOrderButtonText}>Замовити</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                    
                    {!canPlaceOrder && (
                      <View style={[styles.calloutInfoBox, { backgroundColor: theme.colors.surfaceTertiary }]}>
                        <Text style={[styles.calloutInfoText, { color: theme.colors.textSecondary }]}>Переглянути деталі</Text>
                      </View>
                    )}
                    
                    {!item.isAvailable && (
                      <View style={[styles.calloutUnavailableBox, { backgroundColor: theme.colors.errorBackground, borderColor: theme.colors.errorLight }]}>
                        <Text style={[styles.calloutUnavailableText, { color: theme.colors.errorLight }]}>Недоступно</Text>
                      </View>
                    )}
                  </View>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      <View style={[styles.header, { backgroundColor: theme.colors.surfaceSecondary + 'F2', borderColor: theme.colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Карта доступних позицій</Text>
          {locationError && <Text style={[styles.errorText, { color: theme.colors.errorLight }]}>{locationError}</Text>}
        </View>
      </View>

      <View style={[
        styles.bottomSheet,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        isBottomSheetCollapsed && styles.bottomSheetCollapsed
      ]}>
        <TouchableOpacity 
          style={styles.sheetHeader}
          onPress={toggleBottomSheet}
          activeOpacity={0.7}
        >
          <View style={styles.sheetHeaderLeft}>
            <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>Поруч</Text>
            {!isBottomSheetCollapsed && (
              <Text style={[styles.sheetSubtitle, { color: theme.colors.textSecondary }]}>
                {availableItems.length} {availableItems.length === 1 ? 'позиція' : 'позицій'}
              </Text>
            )}
          </View>
          <View style={styles.sheetHeaderRight}>
            {!isBottomSheetCollapsed && (
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  loadFoodItems();
                }}
                style={styles.refreshButton}
              >
                <Text style={[styles.refreshText, { color: theme.colors.primaryAccent }]}>Оновити</Text>
              </TouchableOpacity>
            )}
            {isBottomSheetCollapsed ? (
              <ChevronUp size={20} color={theme.colors.primaryAccent} />
            ) : (
              <ChevronDown size={20} color={theme.colors.primaryAccent} />
            )}
          </View>
        </TouchableOpacity>

        {!isBottomSheetCollapsed && (
          <>
            {!isRestaurant && (
              <View style={styles.filtersRow}>
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Ціна</Text>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
                    maxPrice == null && { backgroundColor: theme.colors.primaryAccent, borderColor: theme.colors.primaryAccent },
                  ]}
                  onPress={() => setMaxPrice(null)}
                >
                  <Text style={[maxPrice == null ? styles.chipTextActive : styles.chipText, { color: maxPrice == null ? theme.colors.white : theme.colors.textSecondary }]}>
                    Будь-яка
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
                    maxPrice === 100 && { backgroundColor: theme.colors.primaryAccent, borderColor: theme.colors.primaryAccent },
                  ]}
                  onPress={() => setMaxPrice(100)}
                >
                  <Text style={[maxPrice === 100 ? styles.chipTextActive : styles.chipText, { color: maxPrice === 100 ? theme.colors.white : theme.colors.textSecondary }]}>
                    до 100₴
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
                    maxPrice === 200 && { backgroundColor: theme.colors.primaryAccent, borderColor: theme.colors.primaryAccent },
                  ]}
                  onPress={() => setMaxPrice(200)}
                >
                  <Text style={[maxPrice === 200 ? styles.chipTextActive : styles.chipText, { color: maxPrice === 200 ? theme.colors.white : theme.colors.textSecondary }]}>
                    до 200₴
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Відстань</Text>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
                    maxDistanceKm == null && { backgroundColor: theme.colors.primaryAccent, borderColor: theme.colors.primaryAccent },
                  ]}
                  onPress={() => setMaxDistanceKm(null)}
                >
                  <Text style={[maxDistanceKm == null ? styles.chipTextActive : styles.chipText, { color: maxDistanceKm == null ? theme.colors.white : theme.colors.textSecondary }]}>
                    Будь-яка
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
                    maxDistanceKm === 1 && { backgroundColor: theme.colors.primaryAccent, borderColor: theme.colors.primaryAccent },
                  ]}
                  onPress={() => setMaxDistanceKm(1)}
                >
                  <Text style={[maxDistanceKm === 1 ? styles.chipTextActive : styles.chipText, { color: maxDistanceKm === 1 ? theme.colors.white : theme.colors.textSecondary }]}>
                    до 1 км
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
                    maxDistanceKm === 3 && { backgroundColor: theme.colors.primaryAccent, borderColor: theme.colors.primaryAccent },
                  ]}
                  onPress={() => setMaxDistanceKm(3)}
                >
                  <Text style={[maxDistanceKm === 3 ? styles.chipTextActive : styles.chipText, { color: maxDistanceKm === 3 ? theme.colors.white : theme.colors.textSecondary }]}>
                    до 3 км
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {availableItems.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>Немає доступних позицій поблизу за вибраними фільтрами</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {availableItems.slice(0, 10).map((item, index) => (
              <TouchableOpacity
                key={item.id || (item as any)._id || `food-item-${index}`}
                style={[
                  styles.itemCard,
                  { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
                  (!item.isAvailable || orderingItemId === item.id || !canPlaceOrder) &&
                    styles.disabledCard,
                ]}
                onPress={canPlaceOrder ? () => {
                  setSelectedOrderItem(item);
                  setOrderModalVisible(true);
                } : undefined}
                disabled={!item.isAvailable || orderingItemId === item.id || !canPlaceOrder}
              >
                <Text style={[styles.itemTitle, { color: theme.colors.text }]}>{item.title}</Text>
                <Text style={[styles.itemRestaurant, { color: theme.colors.textSecondary }]}>
                  {typeof item.restaurant !== 'string' ? item.restaurant?.name : ''}
                </Text>
                <Text style={[styles.itemPrice, { color: theme.colors.primaryAccent }]}>{formatPrice(item.discountedPrice)}</Text>
                <Text style={[styles.itemExpiry, { color: theme.colors.errorLight }]}>{getTimeUntilExpiry(item.expiryTime)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
          </>
        )}
      </View>

      {/* Order Confirmation Modal */}
      <Modal
        visible={orderModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setOrderModalVisible(false);
          setSelectedOrderItem(null);
        }}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay || 'rgba(0, 0, 0, 0.8)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            {selectedOrderItem && (
              <>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Підтвердити замовлення</Text>
                <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
                  Замовити "{selectedOrderItem.title}" з відбором протягом 30 хвилин?
                </Text>
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalCancelButton, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}
                    onPress={() => {
                      setOrderModalVisible(false);
                      setSelectedOrderItem(null);
                    }}
                  >
                    <Text style={[styles.modalCancelButtonText, { color: theme.colors.textSecondary }]}>Скасувати</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.modalConfirmButton, { backgroundColor: theme.colors.primaryAccent }]}
                    onPress={handleOrderConfirm}
                    disabled={orderingItemId === selectedOrderItem.id}
                  >
                    {orderingItemId === selectedOrderItem.id ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.modalConfirmButtonText}>Замовити</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    zIndex: 2,
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(10, 10, 15, 0.9)',
  },
  loadingText: {
    color: '#9CA3AF',
  },
  header: {
    position: 'absolute',
    top: 52,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A3E',
    shadowColor: '#1B7F5F',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E5E5F0',
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: '#F87171',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#151520',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: '#2A2A3E',
    maxHeight: 400,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -5 },
    elevation: 20,
  },
  bottomSheetCollapsed: {
    maxHeight: 60,
    paddingBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  sheetHeaderLeft: {
    flex: 1,
  },
  sheetHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E5E5F0',
  },
  sheetSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  refreshButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  refreshText: {
    color: '#1B7F5F',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyText: {
    color: '#9CA3AF',
  },
  itemCard: {
    width: 180,
    marginRight: 10,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    margin: 12,
    borderColor: '#2A2A3E',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E5F0',
  },
  itemRestaurant: {
    fontSize: 12,
    color: '#9CA3AF',
    marginVertical: 4,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B7F5F',
  },
  itemExpiry: {
    fontSize: 12,
    color: '#F87171',
    marginTop: 4,
  },
  disabledCard: {
    opacity: 0.5,
  },
  callout: {
    width: 220,
    backgroundColor: '#1A1A2E',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
    borderWidth: 1,
    borderColor: '#2A2A3E',
    margin: 0,
    padding: 0,
  },
  calloutImage: {
    width: '100%',
    height: 80,
    backgroundColor: '#2A2A3E',
  },
  calloutContent: {
    padding: 10,
  },
  calloutTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  calloutRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  calloutRatingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calloutDescription: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 6,
    lineHeight: 14,
  },
  calloutRestaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 3,
  },
  calloutRestaurant: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  calloutPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  calloutPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calloutOriginalPrice: {
    fontSize: 10,
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  calloutDiscountPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B7F5F',
  },
  calloutDiscountBadge: {
    backgroundColor: '#f97316',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    gap: 2,
  },
  calloutDiscountText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
  },
  calloutInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calloutTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  calloutTimeText: {
    fontSize: 10,
    color: '#F87171',
    fontWeight: '600',
  },
  calloutQuantity: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  calloutOrderButton: {
    backgroundColor: '#1B7F5F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
    marginTop: 2,
  },
  calloutOrderButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  calloutInfoBox: {
    backgroundColor: '#2A2A3E',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginTop: 2,
  },
  calloutInfoText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '500',
  },
  calloutUnavailableBox: {
    backgroundColor: '#2A1A1A',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#F87171',
  },
  calloutUnavailableText: {
    fontSize: 11,
    color: '#F87171',
    textAlign: 'center',
    fontWeight: '600',
  },
  filtersRow: {
    marginTop: 2,
    marginBottom: 10,
    gap: 10,
  },
  filterGroup: {
    marginBottom: 4,
  },
  filterLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2A2A3E',
    backgroundColor: '#1A1A2E',
  },
  chipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  chipText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  chipTextActive: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#151520',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E5E5F0',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
