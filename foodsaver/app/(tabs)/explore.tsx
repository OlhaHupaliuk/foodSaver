import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import { useEffect, useMemo, useState } from 'react';
import { formatPrice } from '../../utils/format';
import { getTimeUntilExpiry } from '../../utils/discount';
import { api } from '../../services/api';
import { FoodItem } from '../../types/auth';
import { getDefaultCoordinates, getUserLocation } from '../../services/location';
import { useOrderActions } from '../../hooks/useOrderActions';

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
  const { orderingItemId, confirmAndPlaceOrder } = useOrderActions();

  useEffect(() => {
    (async () => {
      const locationResult = await getUserLocation();
      if (locationResult.coords) {
        setRegion((prev) => ({
          ...prev,
          latitude: locationResult.coords!.latitude,
          longitude: locationResult.coords!.longitude,
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

  const availableItems = useMemo(
    () =>
      foodItems.filter((item) => item.isAvailable && coordinatesFromItem(item)),
    [foodItems]
  );

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
              <Callout onPress={() => confirmAndPlaceOrder(item)}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{item.title}</Text>
                  <Text style={styles.calloutSubtitle}>
                    {formatPrice(item.discountedPrice)} · {getTimeUntilExpiry(item.expiryTime)}
                  </Text>
                  <Text style={styles.calloutAction}>Натисніть, щоб замовити</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Карта доступних позицій</Text>
        {locationError && <Text style={styles.errorText}>{locationError}</Text>}
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Поруч</Text>
          <TouchableOpacity onPress={loadFoodItems}>
            <Text style={styles.refreshText}>Оновити</Text>
          </TouchableOpacity>
        </View>

        {availableItems.length === 0 ? (
          <Text style={styles.emptyText}>Немає доступних позицій поблизу</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {availableItems.slice(0, 10).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemCard,
                  (!item.isAvailable || orderingItemId === item.id) && styles.disabledCard,
                ]}
                onPress={() => confirmAndPlaceOrder(item)}
                disabled={!item.isAvailable || orderingItemId === item.id}
              >
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemRestaurant}>{typeof item.restaurant !== 'string' ? item.restaurant?.name : ''}</Text>
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
    backgroundColor: '#f9fafb',
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
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    fontWeight: '600',
  },
  emptyText: {
    color: '#6b7280',
  },
  itemCard: {
    width: 180,
    marginRight: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
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
    maxWidth: 200,
  },
  calloutTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  calloutSubtitle: {
    color: '#6b7280',
    marginBottom: 8,
  },
  calloutAction: {
    color: '#10b981',
    fontWeight: '600',
  },
});
