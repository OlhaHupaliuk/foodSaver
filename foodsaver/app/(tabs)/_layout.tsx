import { Tabs, Redirect } from 'expo-router';
import { Home, Search, ShoppingBag, Store, User } from 'lucide-react-native';

export default function TabLayout() {

  const isRestaurant = true;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 90,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Головна',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
        }}
      />
      {!isRestaurant && (
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Пошук',
            tabBarIcon: ({ size, color }) => <Search size={size} color={color} />,
          }}
        />
      )}
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Замовлення',
          tabBarIcon: ({ size, color }) => <ShoppingBag size={size} color={color} />,
        }}
      />
      {isRestaurant && (
        <Tabs.Screen
          name="manage"
          options={{
            title: 'Управління',
            tabBarIcon: ({ size, color }) => <Store size={size} color={color} />,
          }}
        />
      )}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профіль',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
