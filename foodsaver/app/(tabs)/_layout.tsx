import { Tabs, Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { Home, Search, ShoppingBag, Store, User, BarChart3 } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';

export const unstable_settings = {
  ignoreFileSystemRoutes: true,
};

export default function TabLayout() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

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
      {/* Common home tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Головна',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
        }}
      />

      {/* Explore: only for regular users */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Пошук',
          href: user?.role === 'restaurant_owner' ? null : '/(tabs)/explore',
          tabBarIcon: ({ size, color }) => <Search size={size} color={color} />,
        }}
      />

      {/* Stats: only for restaurant owners */}
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Статистика',
          href: user?.role === 'restaurant_owner' ? '/(tabs)/stats' : null,
          tabBarIcon: ({ size, color }) => <BarChart3 size={size} color={color} />,
        }}
      />

      {/* Orders: visible for both */}
      <Tabs.Screen
        name="orders"
        options={{
          title: user?.role === 'restaurant_owner' ? 'Замовлення' : 'Мої замовлення',
          tabBarIcon: ({ size, color }) => <ShoppingBag size={size} color={color} />,
        }}
      />

      {/* Manage: only for restaurant owners */}
      <Tabs.Screen
        name="manage"
        options={{
          title: 'Управління',
          href: user?.role === 'restaurant_owner' ? '/(tabs)/manage' : null,
          tabBarIcon: ({ size, color }) => <Store size={size} color={color} />,
        }}
      />

      {/* Profile: visible for both */}
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
