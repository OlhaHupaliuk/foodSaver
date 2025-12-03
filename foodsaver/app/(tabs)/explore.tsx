import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import { useEffect, useMemo, useState } from 'react';
import { formatPrice } from '../../utils/format';
import { getTimeUntilExpiry } from '../../utils/discount';
import { api } from '../../services/api';
import { FoodItem } from '../../types/auth';
import { getDefaultCoordinates, getUserLocation } from '../../services/location';
import { useOrderActions } from '../../hooks/useOrderActions';
import { useAuth } from '../../hooks/useAuth';

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
  const { orderingItemId, confirmAndPlaceOrder } = useOrderActions();
  
  // Restaurant owners cannot place orders
  const canPlaceOrder = user?.role !== 'restaurant_owner';

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
        setFoodItems(response.data?.items ?? []);
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
    <View style={styles.container}>
      {(loadingLocation || loadingItems) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Завантажуємо доступні позиції...</Text>
        </View>
      )}

      <MapView
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        loadingEnabled
      >
        {availableItems.map((item) => {
          const coordinate = coordinatesFromItem(item);
          if (!coordinate) return null;

          return (
            <Marker
              key={item.id}
              coordinate={coordinate}
              pinColor="#10b981"
              tracksViewChanges={false}
            >
              <Callout onPress={canPlaceOrder ? () => confirmAndPlaceOrder(item) : undefined}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{item.title}</Text>
                  <Text style={styles.calloutSubtitle}>
                    {formatPrice(item.discountedPrice)} · {getTimeUntilExpiry(item.expiryTime)}
                  </Text>
                  {canPlaceOrder && (
                    <Text style={styles.calloutAction}>Натисніть, щоб замовити</Text>
                  )}
                  {!canPlaceOrder && (
                    <Text style={styles.calloutInfo}>Переглянути деталі</Text>
                  )}
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Карта доступних позицій</Text>
          {locationError && <Text style={styles.errorText}>{locationError}</Text>}
        </View>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Поруч</Text>
          <TouchableOpacity onPress={loadFoodItems}>
            <Text style={styles.refreshText}>Оновити</Text>
          </TouchableOpacity>
        </View>

        {!isRestaurant && (
          <View style={styles.filtersRow}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Ціна</Text>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    maxPrice == null && styles.chipActive,
                  ]}
                  onPress={() => setMaxPrice(null)}
                >
                  <Text style={maxPrice == null ? styles.chipTextActive : styles.chipText}>
                    Будь-яка
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    maxPrice === 100 && styles.chipActive,
                  ]}
                  onPress={() => setMaxPrice(100)}
                >
                  <Text style={maxPrice === 100 ? styles.chipTextActive : styles.chipText}>
                    до 100₴
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    maxPrice === 200 && styles.chipActive,
                  ]}
                  onPress={() => setMaxPrice(200)}
                >
                  <Text style={maxPrice === 200 ? styles.chipTextActive : styles.chipText}>
                    до 200₴
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Відстань</Text>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    maxDistanceKm == null && styles.chipActive,
                  ]}
                  onPress={() => setMaxDistanceKm(null)}
                >
                  <Text style={maxDistanceKm == null ? styles.chipTextActive : styles.chipText}>
                    Будь-яка
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    maxDistanceKm === 1 && styles.chipActive,
                  ]}
                  onPress={() => setMaxDistanceKm(1)}
                >
                  <Text style={maxDistanceKm === 1 ? styles.chipTextActive : styles.chipText}>
                    до 1 км
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    maxDistanceKm === 3 && styles.chipActive,
                  ]}
                  onPress={() => setMaxDistanceKm(3)}
                >
                  <Text style={maxDistanceKm === 3 ? styles.chipTextActive : styles.chipText}>
                    до 3 км
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {availableItems.length === 0 ? (
          <Text style={styles.emptyText}>Немає доступних позицій поблизу за вибраними фільтрами</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {availableItems.slice(0, 10).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemCard,
                  (!item.isAvailable || orderingItemId === item.id || !canPlaceOrder) &&
                    styles.disabledCard,
                ]}
                onPress={canPlaceOrder ? () => confirmAndPlaceOrder(item) : undefined}
                disabled={!item.isAvailable || orderingItemId === item.id || !canPlaceOrder}
              >
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemRestaurant}>
                  {typeof item.restaurant !== 'string' ? item.restaurant?.name : ''}
                </Text>
                <Text style={styles.itemPrice}>{formatPrice(item.discountedPrice)}</Text>
                <Text style={styles.itemExpiry}>{getTimeUntilExpiry(item.expiryTime)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  },
  loadingText: {
    color: '#6b7280',
  },
  header: {
    position: 'absolute',
    top: 52,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: '#ef4444',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  refreshText: {
    color: '#10b981',
    fontWeight: '500',
    fontSize: 14,
  },
  emptyText: {
    color: '#6b7280',
  },
  itemCard: {
    width: 180,
    marginRight: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  itemRestaurant: {
    fontSize: 12,
    color: '#6b7280',
    marginVertical: 4,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  itemExpiry: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  disabledCard: {
    opacity: 0.6,
  },
  callout: {
    maxWidth: 220,
  },
  calloutTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  calloutSubtitle: {
    color: '#6b7280',
    marginBottom: 6,
  },
  calloutAction: {
    color: '#10b981',
    fontWeight: '500',
  },
  calloutInfo: {
    color: '#6b7280',
    fontWeight: '500',
    fontSize: 12,
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
    color: '#6b7280',
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
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  chipActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#38bdf8',
  },
  chipText: {
    fontSize: 12,
    color: '#4b5563',
  },
  chipTextActive: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '600',
  },
});
