import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { formatPrice, formatDateTime } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { Order } from '../../types/auth';
import { ChevronDown, Star } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import StarRating from '../../components/common/StarRating';

export default function OrdersScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [orderHasReview, setOrderHasReview] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  useEffect(() => {
    // Check which orders have reviews
    const checkReviews = async () => {
      const isRestaurantOwner = user?.role === 'restaurant_owner';
      const completedOrders = orders.filter(order => order.status === 'completed' && !isRestaurantOwner);
      const reviewStatus: Record<string, boolean> = {};
      
      for (const order of completedOrders) {
        try {
          const response = await api.reviews.getByOrder(order.id);
          if (response.status === 'success' && response.data) {
            const reviews = (response.data as any).reviews || [];
            // Check if current user has already reviewed this order
            const userHasReviewed = reviews.some((review: any) => 
              review.user && (
                (typeof review.user === 'string' && review.user === user?.id) ||
                (typeof review.user === 'object' && review.user.id === user?.id)
              )
            );
            reviewStatus[order.id] = userHasReviewed;
          } else {
            reviewStatus[order.id] = false;
          }
        } catch (error) {
          reviewStatus[order.id] = false;
        }
      }
      
      setOrderHasReview(reviewStatus);
    };

    const isRestaurantOwner = user?.role === 'restaurant_owner';
    if (orders.length > 0 && !isRestaurantOwner) {
      checkReviews();
    }
  }, [orders, user]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await api.orders.getAll();
      if (response.status === 'success' && response.data) {
        const data = response.data as { orders?: Order[] };
        const list = data.orders || [];

        const now = new Date();
        let filtered = list;

        if (user?.role === 'restaurant_owner') {
          const ownerRestaurantId =
            typeof user.restaurant !== 'string' ? user.restaurant?.id : undefined;

          filtered = list.filter((order) => {
            const orderRestaurantId =
              order.restaurant && typeof order.restaurant !== 'string'
                ? order.restaurant.id
                : undefined;

            if (!ownerRestaurantId || !orderRestaurantId || ownerRestaurantId !== orderRestaurantId) {
              return false;
            }

            const orderUserId =
              order.user && typeof order.user !== 'string' ? (order.user as any).id : undefined;
            if (orderUserId && user.id && orderUserId === user.id) {
              return false;
            }

            if (!order.items || order.items.length === 0) return false;

            return order.items.some((orderItem) => {
              const food = orderItem.foodItem as any;
              if (!food || typeof food === 'string') {
                return true;
              }

              if (!food.expiryTime) {
                return true;
              }

              const expiry = new Date(food.expiryTime);
              return expiry > now;
            });
          });
        }

        setOrders(filtered);
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
    // Only show: pending, completed, cancelled
    const allStatuses = [
      { value: 'pending', label: 'В очікуванні' },
      { value: 'completed', label: 'Завершено' },
      { value: 'cancelled', label: 'Скасовано' },
    ];
    
    // Filter out current status
    return allStatuses.filter(status => status.value !== currentStatus);
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'В очікуванні',
      confirmed: 'В очікуванні', // Map old statuses to new ones
      ready: 'В очікуванні', // Map old statuses to new ones
      completed: 'Завершено',
      cancelled: 'Скасовано',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: '#e39944ff',
      confirmed: '#e39944ff', // Map to pending color
      ready: '#e39944ff', // Map to pending color
      completed: '#1B7F5F',
      cancelled: '#ef4444',
    };
    return colorMap[status] || '#9CA3AF';
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

  const openReviewModal = (order: Order) => {
    setReviewOrder(order);
    setReviewRating(0);
    setReviewComment('');
    setReviewModalVisible(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewOrder || reviewRating === 0) {
      Alert.alert('Помилка', 'Будь ласка, оберіть рейтинг');
      return;
    }

    try {
      setSubmittingReview(true);
      
      // Get the first food item from the order
      const firstItem = reviewOrder.items?.[0];
      if (!firstItem || !firstItem.foodItem) {
        Alert.alert('Помилка', 'Не вдалося знайти позицію для оцінки');
        return;
      }

      const foodItemId = typeof firstItem.foodItem === 'string' 
        ? firstItem.foodItem 
        : (firstItem.foodItem as any)?.id || (firstItem.foodItem as any)?._id;

      if (!foodItemId) {
        Alert.alert('Помилка', 'Не вдалося визначити ID позиції для оцінки');
        return;
      }

      const reviewData: any = {
        foodItem: foodItemId,
        rating: reviewRating,
        order: reviewOrder.id,
      };

      if (reviewComment.trim()) {
        reviewData.comment = reviewComment.trim();
      }

      const response = await api.reviews.create(reviewData);

      if (response.status === 'success') {
        Alert.alert('Успіх', 'Дякуємо за відгук!');
        setReviewModalVisible(false);
        setReviewOrder(null);
        setReviewRating(0);
        setReviewComment('');
        // Reload orders to refresh review status
        loadOrders();
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      Alert.alert('Помилка', error.message || 'Не вдалося відправити відгук');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Замовлення</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadOrders} disabled={loading}>
          <Text style={[styles.refreshText, { color: theme.colors.primary }]}>{loading ? 'Оновлення...' : 'Оновити'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primaryAccent} />
          <Text style={styles.loadingText}>Завантаження замовлень...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>У вас поки немає замовлень</Text>
            </View>
          ) : (
            orders.map((order) => (
              <View key={order.id} style={[styles.orderCard, { backgroundColor: theme.colors.surfaceSecondary }]}>
                <View style={styles.orderHeader}>
                  <View style={{ flex: 1 }}>
                    {isRestaurantOwner ? (
                      <>
                        <Text style={[styles.customerName, { color: theme.colors.text }]}>
                          {order.user && typeof order.user !== 'string' 
                            ? (order.user as any).name || (order.user as any).email 
                            : 'Користувач'}
                        </Text>
                        {order.user && typeof order.user !== 'string' && (order.user as any).phone && (
                          <Text style={[styles.customerPhone, { color: theme.colors.textSecondary }]}>{(order.user as any).phone}</Text>
                        )}
                        {order.user && typeof order.user !== 'string' && (order.user as any).email && (
                          <Text style={[styles.customerEmail, { color: theme.colors.textSecondary }]}>{(order.user as any).email}</Text>
                        )}
                      </>
                    ) : (
                      <Text style={[styles.restaurantName, { color: theme.colors.text }]}>
                        {order.restaurant && typeof order.restaurant !== 'string' 
                          ? order.restaurant.name 
                          : 'Ресторан'}
                      </Text>
                    )}
                    <Text style={[styles.orderSummary, { color: theme.colors.textSecondary }]}>{getOrderSummary(order)}</Text>
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
                  <Text style={[styles.orderPrice, { color: theme.colors.primaryAccent }]}>{formatPrice(order.totalAmount)}</Text>
                  <Text style={[styles.orderDate, { color: theme.colors.textSecondary }]}>{order.createdAt ? formatDateTime(order.createdAt) : ''}</Text>
                </View>

                {order.pickupTime && (
                  <Text style={[styles.pickupTime, { color: theme.colors.textSecondary }]}>
                    Час отримання: {new Date(order.pickupTime).toLocaleString('uk-UA')}
                  </Text>
                )}

                {/* Review button for completed orders (users only) */}
                {!isRestaurantOwner && order.status === 'completed' && (
                  <TouchableOpacity
                    style={[
                      styles.reviewButton,
                      { 
                        backgroundColor: orderHasReview[order.id] 
                          ? theme.colors.surfaceTertiary 
                          : theme.colors.primary,
                        borderColor: theme.colors.primary,
                        opacity: orderHasReview[order.id] ? 0.6 : 1
                      }
                    ]}
                    onPress={() => openReviewModal(order)}
                    disabled={submittingReview || orderHasReview[order.id]}
                  >
                    <Star 
                      size={16} 
                      color={orderHasReview[order.id] ? theme.colors.textSecondary : '#ffffff'} 
                      fill={orderHasReview[order.id] ? theme.colors.textSecondary : '#ffffff'}
                    />
                    <Text style={[
                      styles.reviewButtonText,
                      { color: orderHasReview[order.id] ? theme.colors.textSecondary : '#ffffff' }
                    ]}>
                      {orderHasReview[order.id] ? 'Відгук залишено' : 'Залишити відгук'}
                    </Text>
                  </TouchableOpacity>
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
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Змінити статус замовлення</Text>
            <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
              Поточний статус: {selectedOrder && getStatusText(selectedOrder.status)}
            </Text>

            <ScrollView style={styles.statusOptions}>
              {selectedOrder && getAvailableStatuses(selectedOrder.status).map((status) => (
                <TouchableOpacity
                  key={status.value}
                  style={[styles.statusOption, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}
                  onPress={() => handleStatusChange(selectedOrder.id, status.value)}
                  disabled={updatingStatus === selectedOrder.id}
                >
                  <Text style={[styles.statusOptionText, { color: theme.colors.text }]}>{status.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalCancelButton, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}
              onPress={() => {
                setStatusModalVisible(false);
                setSelectedOrder(null);
              }}
            >
              <Text style={[styles.modalCancelButtonText, { color: theme.colors.textSecondary }]}>Скасувати</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Review Modal */}
      <Modal
        visible={reviewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setReviewModalVisible(false);
          setReviewOrder(null);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Залишити відгук</Text>
              <TouchableOpacity
                onPress={() => {
                  setReviewModalVisible(false);
                  setReviewOrder(null);
                }}
              >
                <Text style={[styles.modalCloseText, { color: theme.colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.reviewForm} keyboardShouldPersistTaps="handled">
              {reviewOrder && (
                <>
                  <Text style={[styles.reviewLabel, { color: theme.colors.text }]}>Оцінка *</Text>
                  <View style={styles.ratingContainer}>
                    <StarRating
                      rating={reviewRating}
                      onRatingChange={setReviewRating}
                      size={32}
                      readonly={false}
                    />
                  </View>

                  <Text style={[styles.reviewLabel, { color: theme.colors.text, marginTop: 20 }]}>
                    Коментар (необов'язково)
                  </Text>
                  <TextInput
                    style={[
                      styles.reviewCommentInput,
                      {
                        backgroundColor: theme.colors.surfaceSecondary,
                        borderColor: theme.colors.border,
                        color: theme.colors.text,
                      }
                    ]}
                    placeholder="Поділіться своїми враженнями..."
                    placeholderTextColor={theme.colors.textSecondary}
                    value={reviewComment}
                    onChangeText={setReviewComment}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    editable={!submittingReview}
                  />

                  <TouchableOpacity
                    style={[
                      styles.submitReviewButton,
                      {
                        backgroundColor: reviewRating > 0 ? theme.colors.primary : theme.colors.surfaceTertiary,
                        opacity: reviewRating > 0 ? 1 : 0.5,
                      }
                    ]}
                    onPress={handleSubmitReview}
                    disabled={reviewRating === 0 || submittingReview}
                  >
                    {submittingReview ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.submitReviewButtonText}>Відправити відгук</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelReviewButton}
                    onPress={() => {
                      setReviewModalVisible(false);
                      setReviewOrder(null);
                    }}
                    disabled={submittingReview}
                  >
                    <Text style={[styles.cancelReviewButtonText, { color: theme.colors.textSecondary }]}>
                      Скасувати
                    </Text>
                  </TouchableOpacity>
                </>
              )}
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
    backgroundColor: '#0A0A0F',
  },
  header: {
    backgroundColor: '#151520',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E5E5F0',
  },
  refreshButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  refreshText: {
    fontSize: 13,
    color: '#1B7F5F',
    fontWeight: '500',
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
    color: '#9CA3AF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
  orderCard: {
    backgroundColor: '#1A1A2E',
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
    color: '#E5E5F0',
    flex: 1,
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  customerEmail: {
    fontSize: 12,
    color: '#9CA3AF',
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
    color: '#E5E5F0',
    flex: 1,
  },
  orderSummary: {
    fontSize: 12,
    color: '#9CA3AF',
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
    color: '#1B7F5F',
  },
  orderDate: {
    fontSize: 14,
    color: '#9ca3af',
  },
  pickupTime: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#151520',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
    borderTopWidth: 1,
    borderTopColor: '#2A2A3E',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E5E5F0',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 20,
  },
  statusOptions: {
    maxHeight: 300,
  },
  statusOption: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  statusOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E5F0',
  },
  modalCancelButton: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  modalCloseText: {
    fontSize: 24,
    fontWeight: '300',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewForm: {
    padding: 8,
  },
  reviewLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  ratingContainer: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewCommentInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 20,
  },
  submitReviewButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitReviewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelReviewButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelReviewButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
