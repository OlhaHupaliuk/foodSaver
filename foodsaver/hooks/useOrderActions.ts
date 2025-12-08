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
  if (!item.restaurant) {
    console.error('Food item has no restaurant:', item);
    return null;
  }
  
  // If restaurant is a string (ID), return it
  if (typeof item.restaurant === 'string') {
    return item.restaurant;
  }
  
  // If restaurant is an object, try to get ID from various possible fields
  if (typeof item.restaurant === 'object') {
    return item.restaurant.id || (item.restaurant as any)._id || null;
  }
  
  console.error('Restaurant is in unexpected format:', item.restaurant);
  return null;
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

    // Get food item ID - try id first, then _id as fallback
    const foodItemId = item.id || (item as any)._id;
    if (!foodItemId) {
      Alert.alert('Помилка', 'Не вдалося визначити ID позиції для замовлення.');
      console.error('Food item has no ID:', item);
      return;
    }

    try {
      setOrderingItemId(foodItemId);

      await api.orders.create({
        restaurant: restaurantId,
        pickupTime,
        items: [
          {
            foodItem: foodItemId,
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

