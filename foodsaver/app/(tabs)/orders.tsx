import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { formatPrice, formatDateTime } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { Order } from '../../types/auth';
import { ChevronDown } from 'lucide-react-native';

export default function OrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await api.orders.getAll();
      if (response.status === 'success' && response.data) {
        const data = response.data as { orders?: Order[] };
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Помилка', 'Не вдалося завантажити замовлення');
    } finally {
      setLoading(false);
    }
  };

  const isRestaurantOwner = user?.role === 'restaurant_owner';

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      const response = await api.orders.updateStatus(orderId, newStatus);
      
      if (response.status === 'success') {
        setOrders(orders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus as Order['status'] }
            : order
        ));
        setStatusModalVisible(false);
        setSelectedOrder(null);
        Alert.alert('Успіх', 'Статус замовлення оновлено');
      }
    } catch (error: any) {
      console.error('Error updating order status:', error);
      Alert.alert('Помилка', error.message || 'Не вдалося оновити статус замовлення');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const openStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setStatusModalVisible(true);
  };

  const getAvailableStatuses = (currentStatus: string) => {
    const allStatuses = [
      { value: 'pending', label: 'Очікує' },
      { value: 'confirmed', label: 'Підтверджено' },
      { value: 'ready', label: 'Готово' },
      { value: 'completed', label: 'Завершено' },
      { value: 'cancelled', label: 'Скасовано' },
    ];
    
    // Filter out current status
    return allStatuses.filter(status => status.value !== currentStatus);
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'Очікує',
      confirmed: 'Підтверджено',
      ready: 'Готово',
      completed: 'Завершено',
      cancelled: 'Скасовано',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      ready: '#8b5cf6',
      completed: '#10b981',
      cancelled: '#ef4444',
    };
    return colorMap[status] || '#6b7280';
  };

  const getOrderSummary = (order: Order) => {
    if (!order.items?.length) {
      return '—';
    }
    const firstItem = order.items[0];
    if (!firstItem || !firstItem.foodItem) {
      return 'Позиція';
    }
    const remaining = order.items.length - 1;
    const firstTitle =
      typeof firstItem.foodItem !== 'string' && firstItem.foodItem?.title
        ? firstItem.foodItem.title
        : 'Позиція';
    return remaining > 0 ? `${firstTitle} +${remaining}` : firstTitle;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Замовлення</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Завантаження замовлень...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>У вас поки немає замовлень</Text>
            </View>
          ) : (
            orders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={{ flex: 1 }}>
                    {isRestaurantOwner ? (
                      <>
                        <Text style={styles.customerName}>
                          {order.user && typeof order.user !== 'string' 
                            ? (order.user as any).name || (order.user as any).email 
                            : 'Користувач'}
                        </Text>
                        {order.user && typeof order.user !== 'string' && (order.user as any).phone && (
                          <Text style={styles.customerPhone}>{(order.user as any).phone}</Text>
                        )}
                        {order.user && typeof order.user !== 'string' && (order.user as any).email && (
                          <Text style={styles.customerEmail}>{(order.user as any).email}</Text>
                        )}
                      </>
                    ) : (
                      <Text style={styles.restaurantName}>
                        {order.restaurant && typeof order.restaurant !== 'string' 
                          ? order.restaurant.name 
                          : 'Ресторан'}
                      </Text>
                    )}
                    <Text style={styles.orderSummary}>{getOrderSummary(order)}</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(order.status) }
                    ]}
                    onPress={isRestaurantOwner ? () => openStatusModal(order) : undefined}
                    disabled={!isRestaurantOwner || updatingStatus === order.id}
                  >
                    {updatingStatus === order.id ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                        {isRestaurantOwner && (
                          <ChevronDown size={16} color="#ffffff" style={{ marginLeft: 4 }} />
                        )}
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.orderDetails}>
                  <Text style={styles.orderPrice}>{formatPrice(order.totalAmount)}</Text>
                  <Text style={styles.orderDate}>{order.createdAt ? formatDateTime(order.createdAt) : ''}</Text>
                </View>

                {order.pickupTime && (
                  <Text style={styles.pickupTime}>
                    Забір: {new Date(order.pickupTime).toLocaleString('uk-UA')}
                  </Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Status Change Modal */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setStatusModalVisible(false);
          setSelectedOrder(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Змінити статус замовлення</Text>
            <Text style={styles.modalSubtitle}>
              Поточний статус: {selectedOrder && getStatusText(selectedOrder.status)}
            </Text>

            <ScrollView style={styles.statusOptions}>
              {selectedOrder && getAvailableStatuses(selectedOrder.status).map((status) => (
                <TouchableOpacity
                  key={status.value}
                  style={styles.statusOption}
                  onPress={() => handleStatusChange(selectedOrder.id, status.value)}
                  disabled={updatingStatus === selectedOrder.id}
                >
                  <Text style={styles.statusOptionText}>{status.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setStatusModalVisible(false);
                setSelectedOrder(null);
              }}
            >
              <Text style={styles.modalCancelButtonText}>Скасувати</Text>
            </TouchableOpacity>
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
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
  orderCard: {
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
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  customerEmail: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  orderSummary: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#6b7280',
  },
  statusText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
  },
  orderDate: {
    fontSize: 14,
    color: '#9ca3af',
  },
  pickupTime: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
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
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  statusOptions: {
    maxHeight: 300,
  },
  statusOption: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  modalCancelButton: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
});
