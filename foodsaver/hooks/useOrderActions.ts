import { useState } from 'react';
import { Alert } from 'react-native';
import { api } from '../services/api';
import { FoodItem } from '../types/auth';

interface OrderOptions {
  quantity?: number;
  pickupOffsetMinutes?: number;
  onSuccess?: () => void;
}

const DEFAULT_PICKUP_OFFSET_MINUTES = 30;

function getRestaurantId(item: FoodItem): string | null {
  if (!item.restaurant) return null;
  return typeof item.restaurant === 'string' ? item.restaurant : item.restaurant.id;
}

export function useOrderActions() {
  const [orderingItemId, setOrderingItemId] = useState<string | null>(null);

  const placeOrder = async (item: FoodItem, options: OrderOptions = {}) => {
    if (!item.isAvailable) {
      Alert.alert('Немає в наявності', 'Ця позиція вже недоступна.');
      return;
    }

    const restaurantId = getRestaurantId(item);
    if (!restaurantId) {
      Alert.alert('Помилка', 'Не вдалося визначити ресторан для замовлення.');
      return;
    }

    const quantity = options.quantity ?? 1;
    const pickupOffsetMinutes = options.pickupOffsetMinutes ?? DEFAULT_PICKUP_OFFSET_MINUTES;
    const pickupTime = new Date(Date.now() + pickupOffsetMinutes * 60 * 1000).toISOString();

    try {
      setOrderingItemId(item.id);

      await api.orders.create({
        restaurant: restaurantId,
        pickupTime,
        items: [
          {
            foodItem: item.id,
            quantity,
          },
        ],
      });

      Alert.alert('Готово', 'Замовлення створено. Перейдіть до вкладки замовлень.');
      options.onSuccess?.();
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Помилка', 'Не вдалося створити замовлення. Спробуйте пізніше.');
    } finally {
      setOrderingItemId(null);
    }
  };

  const confirmAndPlaceOrder = (item: FoodItem, options?: OrderOptions) => {
    if (orderingItemId) {
      return;
    }

    Alert.alert(
      'Підтвердити замовлення',
      `Замовити "${item.title}" з відбором протягом ${options?.pickupOffsetMinutes ?? DEFAULT_PICKUP_OFFSET_MINUTES} хвилин?`,
      [
        { text: 'Скасувати', style: 'cancel' },
        { text: 'Замовити', onPress: () => placeOrder(item, options) },
      ]
    );
  };

  return {
    orderingItemId,
    placeOrder,
    confirmAndPlaceOrder,
  };
}

