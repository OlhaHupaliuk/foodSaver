import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { RestaurantStatisticsResponse } from '../../types/auth';
import { formatPrice } from '../../utils/format';
import { router } from 'expo-router';

// Mock data for demonstration
const MOCK_STATS: RestaurantStatisticsResponse = {
  summary: {
    totalFoodSaved: 342,
    totalMoneySaved: 45680,
    totalRevenue: 123450,
    totalOrders: 156,
    averageRating: 4.7,
  },
  charts: {
    weekly: [
      { label: 'Тиждень 1', orders: 12, revenue: 8500, moneySaved: 3200 },
      { label: 'Тиждень 2', orders: 18, revenue: 12400, moneySaved: 4800 },
      { label: 'Тиждень 3', orders: 15, revenue: 10200, moneySaved: 3900 },
      { label: 'Тиждень 4', orders: 22, revenue: 15600, moneySaved: 5800 },
      { label: 'Тиждень 5', orders: 20, revenue: 14200, moneySaved: 5200 },
      { label: 'Тиждень 6', orders: 25, revenue: 17800, moneySaved: 6500 },
      { label: 'Тиждень 7', orders: 19, revenue: 13500, moneySaved: 5000 },
      { label: 'Тиждень 8', orders: 27, revenue: 19200, moneySaved: 7200 },
    ],
    monthly: [
      { label: 'Січень', orders: 45, revenue: 32000, moneySaved: 12000 },
      { label: 'Лютий', orders: 52, revenue: 36800, moneySaved: 13800 },
      { label: 'Березень', orders: 48, revenue: 34200, moneySaved: 12800 },
      { label: 'Квітень', orders: 61, revenue: 43200, moneySaved: 16200 },
      { label: 'Травень', orders: 58, revenue: 41100, moneySaved: 15400 },
      { label: 'Червень', orders: 67, revenue: 47500, moneySaved: 17800 },
    ],
  },
};

export default function StatsScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<RestaurantStatisticsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [useMockData, setUseMockData] = useState(true); // Toggle to use mock data

  useEffect(() => {
    if (!user || user.role !== 'restaurant_owner') return;
    loadRestaurantStats();
  }, [user, period, useMockData]);

  const loadRestaurantStats = async () => {
    try {
      if (!user?.restaurant || typeof user.restaurant === 'string') {
        setStats(null);
        return;
      }

      setStatsLoading(true);
      setStatsError(null);

      if (useMockData) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setStats(MOCK_STATS);
        setStatsLoading(false);
        return;
      }

      const response = await api.statistics.getRestaurantStats(user.restaurant.id, period);

      if (response.status === 'success' && response.data) {
        setStats(response.data);
      } else {
        setStatsError(response.message || 'Не вдалося завантажити статистику');
      }
    } catch (error: any) {
      console.error('Error loading restaurant stats:', error);
      setStatsError(error.message || 'Не вдалося завантажити статистику');
    } finally {
      setStatsLoading(false);
    }
  };

  const currentChart = useMemo(() => {
    if (!stats) return [];
    if (period === 'week') return stats.charts.weekly;
    if (period === 'month' || period === 'year' || period === 'all') return stats.charts.monthly;
    return [];
  }, [stats, period]);

  if (!user || user.role !== 'restaurant_owner') {
    return (
      <View style={styles.centered}>
        <Text style={styles.infoText}>Статистика доступна лише власникам ресторанів.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Статистика</Text>
        <Text style={styles.subtitle}>Економія та виручка вашого закладу</Text>
      </View>

      <ScrollView style={styles.content}>
        {!user.restaurant && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Створіть ресторан</Text>
            <Text style={styles.infoText}>
              Щоб переглядати статистику, спочатку додайте інформацію про ваш заклад.
            </Text>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => router.push('/(tabs)/manage')}
            >
              <Text style={styles.infoButtonText}>Перейти до управління</Text>
            </TouchableOpacity>
          </View>
        )}

        {user.restaurant && (
          <View style={styles.body}>
            <View style={styles.statsHeaderRow}>
              <Text style={styles.sectionTitle}>Огляд показників</Text>
              <View style={styles.periodSelector}>
                {(['week', 'month', 'year', 'all'] as const).map((p, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.periodChip,
                      period === p && styles.periodChipActive,
                    ]}
                    onPress={() => setPeriod(p)}
                    disabled={statsLoading}
                  >
                    <Text
                      style={[
                        styles.periodChipText,
                        period === p && styles.periodChipTextActive,
                      ]}
                    >
                      {p === 'week'
                        ? 'Тиждень'
                        : p === 'month'
                        ? 'Місяць'
                        : p === 'year'
                        ? 'Рік'
                        : 'Весь час'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {statsLoading && (
              <View style={styles.loadingStats}>
                <ActivityIndicator size="small" color="#10b981" />
                <Text style={styles.loadingStatsText}>Завантаження статистики...</Text>
              </View>
            )}

            {statsError && !statsLoading && (
              <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>Помилка</Text>
                <Text style={styles.errorDescription}>{statsError}</Text>
              </View>
            )}

            {stats && !statsLoading && !statsError && (
              <>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Зекономлено грошей</Text>
                    <Text style={styles.summaryValue}>
                      {formatPrice(stats.summary.totalMoneySaved || 0)}
                    </Text>
                  </View>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Виручка</Text>
                    <Text style={styles.summaryValue}>
                      {formatPrice(stats.summary.totalRevenue || 0)}
                    </Text>
                  </View>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Збережено порцій</Text>
                    <Text style={styles.summaryValue}>
                      {stats.summary.totalFoodSaved || 0}
                    </Text>
                  </View>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Замовлень</Text>
                    <Text style={styles.summaryValue}>
                      {stats.summary.totalOrders || 0}
                    </Text>
                  </View>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Середній рейтинг</Text>
                    <Text style={styles.summaryValue}>
                      {stats.summary.averageRating?.toFixed(1) ?? '—'}
                    </Text>
                  </View>
                </View>

                {currentChart.length > 0 && (
                  <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>
                      Динаміка виручки ({period === 'week' ? 'по тижнях' : 'по місяцях'})
                    </Text>
                    {currentChart.map((point) => {
                      const maxRevenue = Math.max(
                        ...currentChart.map((p) => p.revenue || 0),
                        1
                      );
                      const widthPercent = Math.max(
                        8,
                        Math.round((point.revenue / maxRevenue) * 100)
                      );

                      return (
                        <View key={point.label} style={styles.chartRow}>
                          <View style={styles.chartRowHeader}>
                            <Text style={styles.chartLabel}>{point.label}</Text>
                            <Text style={styles.chartValue}>
                              {formatPrice(point.revenue)}
                            </Text>
                          </View>
                          <View style={styles.chartBarBackground}>
                            <View
                              style={[
                                styles.chartBarFill,
                                { width: `${widthPercent}%` },
                              ]}
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Money Saved Chart - Line-like visualization */}
                {currentChart.length > 0 && (
                  <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>
                      Економія грошей ({period === 'week' ? 'по тижнях' : 'по місяцях'})
                    </Text>
                    {currentChart.map((point) => {
                      const maxSaved = Math.max(
                        ...currentChart.map((p) => p.moneySaved || 0),
                        1
                      );
                      const widthPercent = Math.max(
                        8,
                        Math.round((point.moneySaved / maxSaved) * 100)
                      );

                      return (
                        <View key={`saved-${point.label}`} style={styles.chartRow}>
                          <View style={styles.chartRowHeader}>
                            <Text style={styles.chartLabel}>{point.label}</Text>
                            <Text style={styles.chartValue}>
                              {formatPrice(point.moneySaved)}
                            </Text>
                          </View>
                          <View style={styles.chartBarBackground}>
                            <View
                              style={[
                                styles.chartBarFillMoneySaved,
                                { width: `${widthPercent}%` },
                              ]}
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Orders Chart - Column visualization */}
                {currentChart.length > 0 && (
                  <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>
                      Кількість замовлень ({period === 'week' ? 'по тижнях' : 'по місяцях'})
                    </Text>
                    <View style={styles.ordersChartContainer}>
                      {currentChart.map((point) => {
                        const maxOrders = Math.max(
                          ...currentChart.map((p) => p.orders || 0),
                          1
                        );
                        const heightPercent = Math.max(
                          10,
                          Math.round((point.orders / maxOrders) * 100)
                        );

                        return (
                          <View key={`orders-${point.label}`} style={styles.ordersChartItem}>
                            <View style={styles.ordersChartBarContainer}>
                              <View
                                style={[
                                  styles.ordersChartBar,
                                  { height: `${heightPercent}%` },
                                ]}
                              />
                            </View>
                            <Text style={styles.ordersChartLabel}>{point.label}</Text>
                            <Text style={styles.ordersChartValue}>{point.orders}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Comparison Chart - Revenue vs Money Saved */}
                {currentChart.length > 0 && (
                  <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>
                      Порівняння: Виручка vs Економія
                    </Text>
                    {currentChart.map((point) => {
                      const maxValue = Math.max(
                        ...currentChart.map((p) => Math.max(p.revenue || 0, p.moneySaved || 0)),
                        1
                      );
                      const revenuePercent = Math.max(
                        5,
                        Math.round((point.revenue / maxValue) * 100)
                      );
                      const savedPercent = Math.max(
                        5,
                        Math.round((point.moneySaved / maxValue) * 100)
                      );

                      return (
                        <View key={`comparison-${point.label}`} style={styles.comparisonRow}>
                          <Text style={styles.comparisonLabel}>{point.label}</Text>
                          <View style={styles.comparisonBars}>
                            <View style={styles.comparisonBarContainer}>
                              <View style={styles.comparisonBarLabel}>
                                <Text style={styles.comparisonBarLabelText}>Виручка</Text>
                                <Text style={styles.comparisonBarValue}>
                                  {formatPrice(point.revenue)}
                                </Text>
                              </View>
                              <View style={styles.chartBarBackground}>
                                <View
                                  style={[
                                    styles.chartBarFill,
                                    { width: `${revenuePercent}%` },
                                  ]}
                                />
                              </View>
                            </View>
                            <View style={styles.comparisonBarContainer}>
                              <View style={styles.comparisonBarLabel}>
                                <Text style={styles.comparisonBarLabelText}>Економія</Text>
                                <Text style={styles.comparisonBarValue}>
                                  {formatPrice(point.moneySaved)}
                                </Text>
                              </View>
                              <View style={styles.chartBarBackground}>
                                <View
                                  style={[
                                    styles.chartBarFillMoneySaved,
                                    { width: `${savedPercent}%` },
                                  ]}
                                />
                              </View>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Mock Data Toggle */}
                <View style={styles.mockDataToggle}>
                  <TouchableOpacity
                    style={[styles.mockToggleButton, useMockData && styles.mockToggleButtonActive]}
                    onPress={() => setUseMockData(!useMockData)}
                  >
                    <Text style={[styles.mockToggleText, useMockData && styles.mockToggleTextActive]}>
                      {useMockData ? '✓ Використовуються тестові дані' : 'Використовувати тестові дані'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  header: {
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2A2A3E',
    backgroundColor: '#151520',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#E5E5F0',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  content: {
    flex: 1,
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statsHeaderRow: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E5E5F0',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 6,
  },
  periodChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2A2A3E',
    backgroundColor: '#1A1A2E',
  },
  periodChipActive: {
    backgroundColor: '#1B7F5F',
    borderColor: '#1B7F5F',
  },
  periodChipText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  periodChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  loadingStatsText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  errorCard: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2A1A1A',
    borderWidth: 1,
    borderColor: '#F87171',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F87171',
    marginBottom: 2,
  },
  errorDescription: {
    fontSize: 13,
    color: '#F87171',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  summaryCard: {
    flexBasis: '48%',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E5E5F0',
  },
  chartCard: {
    marginTop: 20,
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E5F0',
    marginBottom: 8,
  },
  chartRow: {
    marginBottom: 8,
  },
  chartRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chartLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  chartValue: {
    fontSize: 12,
    color: '#E5E5F0',
    fontWeight: '600',
  },
  chartBarBackground: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#2A2A3E',
    overflow: 'hidden',
  },
  chartBarFill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#1B7F5F',
  },
  chartBarFillMoneySaved: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#06B6D4',
  },
  ordersChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginTop: 8,
    paddingVertical: 12,
    minHeight: 120,
  },
  ordersChartItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  ordersChartBarContainer: {
    width: '100%',
    height: 80,
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  ordersChartBar: {
    width: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
    minHeight: 8,
  },
  ordersChartLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  ordersChartValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E5E5F0',
    marginTop: 2,
  },
  comparisonRow: {
    marginBottom: 16,
  },
  comparisonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E5E5F0',
    marginBottom: 8,
  },
  comparisonBars: {
    gap: 8,
  },
  comparisonBarContainer: {
    marginBottom: 4,
  },
  comparisonBarLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  comparisonBarLabelText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  comparisonBarValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E5E5F0',
  },
  mockDataToggle: {
    marginTop: 20,
    marginBottom: 20,
  },
  mockToggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#2A2A3E',
    alignItems: 'center',
  },
  mockToggleButtonActive: {
    backgroundColor: '#1B7F5F',
    borderColor: '#1B7F5F',
  },
  mockToggleText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  mockToggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#1A2A3E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#06B6D4',
    margin: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E5F0',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  infoButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#06B6D4',
  },
  infoButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#0A0A0F',
  },
});


