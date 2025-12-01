import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Modal } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { useEffect, useMemo, useState } from 'react';
import { formatPrice } from '../../utils/format';
import { getTimeUntilExpiry } from '../../utils/discount';
import { api } from '../../services/api';
import { FoodItem } from '../../types/auth';
import { getDefaultCoordinates, getUserLocation } from '../../services/location';
import { useOrderActions } from '../../hooks/useOrderActions';
import FoodMarker from '../../components/maps/FoodMarker';
import { X, Clock, MapPin, Phone, ShoppingCart } from 'lucide-react-native';

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
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
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

  const handleMarkerPress = (item: FoodItem) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const handleOrderFromModal = () => {
    if (selectedItem) {
      setModalVisible(false);
      confirmAndPlaceOrder(selectedItem);
    }
  };

  const calculateDiscount = (item: FoodItem) => {
    if (!item.originalPrice || !item.discountedPrice) return 0;
    return Math.round((1 - item.discountedPrice / item.originalPrice) * 100);
  };

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

          const discount = calculateDiscount(item);

          return (
            <FoodMarker
              key={item.id}
              coordinate={coordinate}
              title={item.title}
              price={item.discountedPrice}
              originalPrice={item.originalPrice}
              discount={discount}
              onPress={() => handleMarkerPress(item)}
            />
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
                onPress={() => handleMarkerPress(item)}
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

      {/* Detailed Item Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedItem && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderContent}>
                    <Text style={styles.modalTitle}>{selectedItem.title}</Text>
                    {typeof selectedItem.restaurant !== 'string' && (
                      <Text style={styles.modalRestaurant}>
                        {selectedItem.restaurant?.name}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <X size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  {selectedItem.description && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalDescription}>{selectedItem.description}</Text>
                    </View>
                  )}

                  {selectedItem.category && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalCategory}>{selectedItem.category}</Text>
                    </View>
                  )}

                  <View style={styles.modalSection}>
                    <View style={styles.priceContainer}>
                      <View>
                        <Text style={styles.modalPrice}>{formatPrice(selectedItem.discountedPrice)}</Text>
                        {selectedItem.originalPrice && selectedItem.originalPrice > selectedItem.discountedPrice && (
                          <Text style={styles.modalOriginalPrice}>
                            {formatPrice(selectedItem.originalPrice)}
                          </Text>
                        )}
                      </View>
                      {calculateDiscount(selectedItem) > 0 && (
                        <View style={styles.modalDiscountBadge}>
                          <Text style={styles.modalDiscountText}>
                            -{calculateDiscount(selectedItem)}%
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.modalInfoGrid}>
                    <View style={styles.modalInfoItem}>
                      <Clock size={18} color="#ef4444" />
                      <View style={styles.modalInfoText}>
                        <Text style={styles.modalInfoLabel}>До закінчення</Text>
                        <Text style={styles.modalInfoValue}>
                          {getTimeUntilExpiry(selectedItem.expiryTime)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.modalInfoItem}>
                      <ShoppingCart size={18} color="#10b981" />
                      <View style={styles.modalInfoText}>
                        <Text style={styles.modalInfoLabel}>В наявності</Text>
                        <Text style={styles.modalInfoValue}>{selectedItem.quantity} шт.</Text>
                      </View>
                    </View>
                  </View>

                  {typeof selectedItem.restaurant !== 'string' && selectedItem.restaurant && (
                    <View style={styles.modalSection}>
                      <View style={styles.restaurantInfo}>
                        <MapPin size={18} color="#6b7280" />
                        <Text style={styles.restaurantAddress}>
                          {selectedItem.restaurant.address}
                        </Text>
                      </View>
                      {selectedItem.restaurant.phone && (
                        <View style={styles.restaurantInfo}>
                          <Phone size={18} color="#6b7280" />
                          <Text style={styles.restaurantPhone}>
                            {selectedItem.restaurant.phone}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[
                      styles.orderButton,
                      (!selectedItem.isAvailable || orderingItemId === selectedItem.id) && styles.orderButtonDisabled
                    ]}
                    onPress={handleOrderFromModal}
                    disabled={!selectedItem.isAvailable || orderingItemId === selectedItem.id}
                  >
                    {orderingItemId === selectedItem.id ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.orderButtonText}>
                        {selectedItem.isAvailable ? 'Замовити' : 'Недоступно'}
                      </Text>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalHeaderContent: {
    flex: 1,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  modalRestaurant: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  modalCategory: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: '#10b981',
  },
  modalOriginalPrice: {
    fontSize: 18,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    marginTop: 4,
  },
  modalDiscountBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modalDiscountText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalInfoGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  modalInfoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  modalInfoText: {
    flex: 1,
  },
  modalInfoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  modalInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  restaurantPhone: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  orderButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  orderButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  orderButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
});
