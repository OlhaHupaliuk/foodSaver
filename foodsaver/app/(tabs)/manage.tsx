import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react-native';
import { formatPrice } from '../../utils/format';
import { getTimeUntilExpiry } from '../../utils/discount';

export default function ManageScreen() {
  const user = {email: '', name:'', user_type:'restaurant', phone: '' };
  const [restaurant, setRestaurant] = useState<any | null>(null);
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
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
    if (user) {
      loadRestaurantData();
    }
  }, [user]);

  const loadRestaurantData = async () => {

  };

  const handleAddItem = async () => {
  
  };

  const toggleAvailability = async (itemId: string, currentStatus: boolean) => {

  };

  if (!restaurant) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Управління</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Створіть профіль ресторану для продовження</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Управління</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>{restaurant.name}</Text>
          <Text style={styles.statsValue}>{foodItems.length} позицій</Text>
        </View>

        {foodItems.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <TouchableOpacity
                style={[styles.statusBadge, !item.is_available && styles.statusBadgeInactive]}
                onPress={() => toggleAvailability(item.id, item.is_available)}
              >
                <Text style={styles.statusText}>
                  {item.is_available ? 'Активна' : 'Неактивна'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.itemDetails}>
              <Text style={styles.itemPrice}>
                {formatPrice(item.discount_price)} <Text style={styles.itemPriceOriginal}>({formatPrice(item.original_price)})</Text>
              </Text>
              <Text style={styles.itemQuantity}>Кількість: {item.quantity}</Text>
              <Text style={styles.itemExpiry}>Спливає: {getTimeUntilExpiry(item.expiry_time)}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Додати страву</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <TextInput
                style={styles.modalInput}
                placeholder="Назва страви"
                value={newItem.title}
                onChangeText={(text) => setNewItem({ ...newItem, title: text })}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Опис"
                value={newItem.description}
                onChangeText={(text) => setNewItem({ ...newItem, description: text })}
                multiline
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Категорія"
                value={newItem.category}
                onChangeText={(text) => setNewItem({ ...newItem, category: text })}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Оригінальна ціна"
                value={newItem.original_price}
                onChangeText={(text) => setNewItem({ ...newItem, original_price: text })}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Ціна зі знижкою"
                value={newItem.discount_price}
                onChangeText={(text) => setNewItem({ ...newItem, discount_price: text })}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Кількість"
                value={newItem.quantity}
                onChangeText={(text) => setNewItem({ ...newItem, quantity: text })}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Годин до закінчення"
                value={newItem.expiry_hours}
                onChangeText={(text) => setNewItem({ ...newItem, expiry_hours: text })}
                keyboardType="numeric"
              />

              <TouchableOpacity style={styles.modalButton} onPress={handleAddItem}>
                <Text style={styles.modalButtonText}>Додати</Text>
              </TouchableOpacity>
            </ScrollView>
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
  },
  content: {
    flex: 1,
    padding: 20,
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
  },
  statsCard: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 14,
    color: '#d1fae5',
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
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
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
    gap: 4,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  itemPriceOriginal: {
    fontSize: 14,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    fontWeight: '400',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6b7280',
  },
  itemExpiry: {
    fontSize: 14,
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
  modalButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});
