import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { RestaurantStatisticsResponse } from '../../types/auth';
import { formatPrice } from '../../utils/format';
import { router } from 'expo-router';

export default function StatsScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<RestaurantStatisticsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');

  useEffect(() => {
    if (!user || user.role !== 'restaurant_owner') return;
    loadRestaurantStats();
  }, [user, period]);

  const loadRestaurantStats = async () => {
    try {
      if (!user?.restaurant || typeof user.restaurant === 'string') {
        setStats(null);
        return;
      }

      setStatsLoading(true);
      setStatsError(null);

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

  const currentWeeklyChart = useMemo(
    () => stats?.charts.weekly ?? [],
    [stats]
  );

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

                {currentWeeklyChart.length > 0 && (
                  <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>Динаміка за останні тижні</Text>
                    {currentWeeklyChart.map((point) => {
                      const maxRevenue = Math.max(
                        ...currentWeeklyChart.map((p) => p.revenue || 0),
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  content: {
    flex: 1,
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
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
    borderColor: '#e5e7eb',
  },
  periodChipActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  periodChipText: {
    fontSize: 12,
    color: '#6b7280',
  },
  periodChipTextActive: {
    color: '#047857',
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
    color: '#6b7280',
  },
  errorCard: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b91c1c',
    marginBottom: 2,
  },
  errorDescription: {
    fontSize: 13,
    color: '#991b1b',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  summaryCard: {
    flexBasis: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  chartCard: {
    marginTop: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
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
    color: '#6b7280',
  },
  chartValue: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
  },
  chartBarBackground: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  chartBarFill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#10b981',
  },
  infoCard: {
    backgroundColor: '#ecfeff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
    margin: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#1e293b',
    marginBottom: 8,
  },
  infoButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#0ea5e9',
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
    backgroundColor: '#f5f5f5',
  },
});


