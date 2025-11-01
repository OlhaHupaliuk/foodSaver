import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { Plus, X, Clock, DollarSign, Trash2 } from 'lucide-react-native';
import { formatPrice } from '../../utils/format';
import { getTimeUntilExpiry } from '../../utils/discount';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';

export default function ManageScreen() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<any | null>(null);
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    category: '',
    original_price: '',
    discount_price: '',
    quantity: '1',
    expiry_hours: '6',
  });

  useEffect(() => {
    if (user?.role === 'restaurant_owner') {
      loadRestaurantData();
      loadFoodItems();
    }
  }, [user]);

  const loadRestaurantData = async () => {
    try {
      setRestaurant({
        id: user?.id,
        name: user?.name,
        address: user?.restaurant.address,
        phone: user?.phone,
      });
    } catch (error) {
      console.error('Error loading restaurant:', error);
    }
  };

  const loadFoodItems = async () => {
    try {
      setLoading(true);
      const response = await api.foodItems.getByRestaurant(user?.id || '');
      
      if (response.status === 'success' && response.data) {
        setFoodItems(response.data || []);
      }
    } catch (error) {
      console.error('Error loading food items:', error);
      Alert.alert('Помилка', 'Не вдалося завантажити пропозиції');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!newItem.title.trim()) {
      Alert.alert('Помилка', 'Введіть назву страви');
      return false;
    }
    if (!newItem.description.trim()) {
      Alert.alert('Помилка', 'Введіть опис страви');
      return false;
    }
    if (!newItem.original_price || parseFloat(newItem.original_price) <= 0) {
      Alert.alert('Помилка', 'Введіть коректну оригінальну ціну');
      return false;
    }
    if (!newItem.discount_price || parseFloat(newItem.discount_price) <= 0) {
      Alert.alert('Помилка', 'Введіть коректну ціну зі знижкою');
      return false;
    }
    if (parseFloat(newItem.discount_price) >= parseFloat(newItem.original_price)) {
      Alert.alert('Помилка', 'Ціна зі знижкою повинна бути меншою за оригінальну');
      return false;
    }
    if (!newItem.quantity || parseInt(newItem.quantity) <= 0) {
      Alert.alert('Помилка', 'Введіть коректну кількість');
      return false;
    }
    if (!newItem.expiry_hours || parseInt(newItem.expiry_hours) <= 0) {
      Alert.alert('Помилка', 'Введіть коректний час до закінчення');
      return false;
    }
    return true;
  };

  const handleAddItem = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() + parseInt(newItem.expiry_hours));

      const itemData = {
        name: newItem.title,
        description: newItem.description,
        category: newItem.category || 'Інше',
        originalPrice: parseFloat(newItem.original_price),
        discountedPrice: parseFloat(newItem.discount_price),
        quantity: parseInt(newItem.quantity),
        expiryTime: expiryTime.toISOString(),
        isAvailable: true,
        restaurant: user?.id, 
      };


      const response = await api.foodItems.create(itemData);

      if (response.status === 'success') {
        // Додати нову позицію до списку
        setFoodItems([...foodItems, response.data]);
        
        // Очистити форму
        setNewItem({
          title: '',
          description: '',
          category: '',
          original_price: '',
          discount_price: '',
          quantity: '1',
          expiry_hours: '6',
        });
        
        setShowAddModal(false);
        Alert.alert('Успіх', 'Пропозицію успішно додано');
      }
    } catch (error: any) {
      console.error('Error adding item:', error);
      Alert.alert('Помилка', error.message || 'Не вдалося додати пропозицію');
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (itemId: string, currentStatus: boolean) => {
    try {
      const response = await api.foodItems.update(itemId, {
        is_available: !currentStatus,
      });

      if (response.status === 'success') {
        setFoodItems(foodItems.map(item => 
          item.id === itemId 
            ? { ...item, is_available: !currentStatus }
            : item
        ));
      }
    } catch (error) {
      console.error('Error updating item:', error);
      Alert.alert('Помилка', 'Не вдалося оновити статус');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    Alert.alert(
      'Видалити пропозицію?',
      'Ця дія не може бути скасована',
      [
        { text: 'Скасувати', onPress: () => {} },
        {
          text: 'Видалити',
          onPress: async () => {
            try {
              await api.foodItems.delete(itemId);
              setFoodItems(foodItems.filter(item => item.id !== itemId));
              Alert.alert('Успіх', 'Пропозицію видалено');
            } catch (error) {
              Alert.alert('Помилка', 'Не вдалося видалити пропозицію');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const calculateDiscount = () => {
    if (newItem.original_price && newItem.discount_price) {
      const original = parseFloat(newItem.original_price);
      const discount = parseFloat(newItem.discount_price);
      if (original > 0 && discount > 0 && discount < original) {
        return Math.round((1 - discount / original) * 100);
      }
    }
    return 0;
  };

  if (!restaurant) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Управління</Text>
        </View>
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.emptyText} numberOfLines={1}>
            Завантаження...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Управління</Text>
          <Text style={styles.headerSubtitle}>{restaurant.name}</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Завантаження пропозицій...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>{restaurant.name}</Text>
            <Text style={styles.statsValue}>
              {foodItems.length} {foodItems.length === 1 ? 'позиція' : 'позицій'}
            </Text>
            <Text style={styles.statsSubvalue}>
              {foodItems.filter(item => item.is_available).length} активних
            </Text>
          </View>

          {foodItems.length === 0 ? (
            <View style={styles.emptyListState}>
              <Plus size={48} color="#d1d5db" />
              <Text style={styles.emptyListText}>
                Поки немає пропозицій
              </Text>
              <Text style={styles.emptyListSubtext}>
                Натисніть "+" щоб додати першу страву
              </Text>
            </View>
          ) : (
            foodItems.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.statusBadge,
                      !item.is_available && styles.statusBadgeInactive
                    ]}
                    onPress={() => toggleAvailability(item.id, item.is_available)}
                  >
                    <Text style={styles.statusText}>
                      {item.is_available ? 'Активна' : 'Неактивна'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.itemDescription} numberOfLines={2}>
                  {item.description}
                </Text>

                {item.category && (
                  <Text style={styles.itemCategory}>{item.category}</Text>
                )}

                <View style={styles.itemDetails}>
                  <View style={styles.priceRow}>
                    <Text style={styles.itemPrice}>
                      {formatPrice(item.discount_price)}
                    </Text>
                    <Text style={styles.itemPriceOriginal}>
                      {formatPrice(item.original_price)}
                    </Text>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>
                        -{Math.round((1 - item.discount_price / item.original_price) * 100)}%
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.metaRow}>
                    <Text style={styles.itemQuantity}>
                      Кількість: {item.quantity}
                    </Text>
                    <Text style={styles.itemExpiry}>
                      <Clock size={12} color="#ef4444" /> {getTimeUntilExpiry(item.expiry_time)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteItem(item.id)}
                >
                  <Trash2 size={16} color="#ef4444" />
                  <Text style={styles.deleteButtonText}>Видалити</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Модальне вікно додавання страви */}
      <Modal 
        visible={showAddModal} 
        animationType="slide" 
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Додати пропозицію</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalForm}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <TextInput
                style={styles.modalInput}
                placeholder="Назва страви *"
                placeholderTextColor="#9ca3af"
                value={newItem.title}
                onChangeText={(text) => setNewItem({ ...newItem, title: text })}
                editable={!saving}
              />

              <TextInput
                style={[styles.modalInput, styles.modalInputMultiline]}
                placeholder="Опис *"
                placeholderTextColor="#9ca3af"
                value={newItem.description}
                onChangeText={(text) => setNewItem({ ...newItem, description: text })}
                multiline
                numberOfLines={3}
                editable={!saving}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Категорія (напр. Суші, Піца)"
                placeholderTextColor="#9ca3af"
                value={newItem.category}
                onChangeText={(text) => setNewItem({ ...newItem, category: text })}
                editable={!saving}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Оригінальна ціна (грн) *"
                placeholderTextColor="#9ca3af"
                value={newItem.original_price}
                onChangeText={(text) => setNewItem({ ...newItem, original_price: text })}
                keyboardType="decimal-pad"
                editable={!saving}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Ціна зі знижкою (грн) *"
                placeholderTextColor="#9ca3af"
                value={newItem.discount_price}
                onChangeText={(text) => setNewItem({ ...newItem, discount_price: text })}
                keyboardType="decimal-pad"
                editable={!saving}
              />

              {calculateDiscount() > 0 && (
                <View style={styles.discountPreview}>
                  <DollarSign size={16} color="#10b981" />
                  <Text style={styles.discountPreviewText}>
                    Знижка: {calculateDiscount()}%
                  </Text>
                </View>
              )}

              <TextInput
                style={styles.modalInput}
                placeholder="Кількість порцій *"
                placeholderTextColor="#9ca3af"
                value={newItem.quantity}
                onChangeText={(text) => setNewItem({ ...newItem, quantity: text })}
                keyboardType="number-pad"
                editable={!saving}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Годин до закінчення *"
                placeholderTextColor="#9ca3af"
                value={newItem.expiry_hours}
                onChangeText={(text) => setNewItem({ ...newItem, expiry_hours: text })}
                keyboardType="number-pad"
                editable={!saving}
              />

              <TouchableOpacity 
                style={[styles.modalButton, saving && styles.modalButtonDisabled]}
                onPress={handleAddItem}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.modalButtonText}>Додати пропозицію</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={() => setShowAddModal(false)}
                disabled={saving}
              >
                <Text style={styles.modalCancelButtonText}>Скасувати</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#10b981',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
  },
  statsCard: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 16,
    color: '#d1fae5',
    fontWeight: '600',
  },
  statsSubvalue: {
    fontSize: 14,
    color: '#d1fae5',
    marginTop: 4,
  },
  emptyListState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyListText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    marginTop: 16,
  },
  emptyListSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  itemDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  itemCategory: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  statusBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusBadgeInactive: {
    backgroundColor: '#9ca3af',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  itemDetails: {
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
  },
  itemPriceOriginal: {
    fontSize: 14,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6b7280',
  },
  itemExpiry: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 6,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalForm: {
    padding: 20,
  },
  modalInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
  },
  modalInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  discountPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  discountPreviewText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  modalButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalCancelButton: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
});
