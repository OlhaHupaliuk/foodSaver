import { Tabs, Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { Home, Search, ShoppingBag, Store, User } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';

type TabConfig = {
  name: string;
  title: string;
  Icon: typeof Home;
};

const customerTabs: TabConfig[] = [
  { name: 'index', title: 'Головна', Icon: Home },
  { name: 'explore', title: 'Пошук', Icon: Search },
  { name: 'orders', title: 'Замовлення', Icon: ShoppingBag },
  { name: 'profile', title: 'Профіль', Icon: User },
];

const restaurantTabs: TabConfig[] = [
  { name: 'index', title: 'Головна', Icon: Home },
  { name: 'orders', title: 'Замовлення', Icon: ShoppingBag },
  { name: 'manage', title: 'Управління', Icon: Store },
  { name: 'profile', title: 'Профіль', Icon: User },
];

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

  const tabsToRender = user?.role === 'restaurant_owner' ? restaurantTabs : customerTabs;

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
      {tabsToRender.map(({ name, title, Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ size, color }) => <Icon size={size} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
