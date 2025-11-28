import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { formatPrice, formatDateTime } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { Order } from '../../types/auth';

export default function OrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      const response = await api.orders.getAll();
      if (response.status === 'success' && response.data) {
        setOrders(response.data.orders || []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }
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

  const getOrderSummary = (order: Order) => {
    if (!order.items?.length) {
      return '—';
    }
    const firstItem = order.items[0];
    const remaining = order.items.length - 1;
    const firstTitle =
      typeof firstItem.foodItem !== 'string' ? firstItem.foodItem.title : 'Позиція';
    return remaining > 0 ? `${firstTitle} +${remaining}` : firstTitle;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Замовлення</Text>
      </View>

      <ScrollView style={styles.content}>
        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>У вас поки немає замовлень</Text>
          </View>
        ) : (
          orders.map((order) => (
            <TouchableOpacity key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.restaurantName}>{order.restaurant && typeof order.restaurant !== 'string' ? order.restaurant.name : 'Ресторан'}</Text>
                  <Text style={styles.orderSummary}>{getOrderSummary(order)}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                </View>
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
            </TouchableOpacity>
          ))
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
  },
  statusText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
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
});
