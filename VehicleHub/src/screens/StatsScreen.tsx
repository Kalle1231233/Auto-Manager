import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useVehicles } from '../hooks/useVehicles';
import { useEntries } from '../hooks/useEntries';
import { BarChart } from '../components/BarChart';
import { DonutChart } from '../components/DonutChart';
import { MileageChart } from '../components/MileageChart';
import { SectionHeader } from '../components/SectionHeader';
import {
  getCostsByCategory,
  getMonthlyStats,
  getYearlyCosts,
  getTotalCost,
  getAvgMonthlyCost,
  getMileageHistory,
  getAvailableYears,
} from '../utils/stats';
import { formatCurrency, formatMileage } from '../utils/calculations';
import { CATEGORY_CONFIG } from '../constants/categories';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../constants/theme';

export function StatsScreen() {
  const { vehicles } = useVehicles();
  const { entries } = useEntries();

  const availableYears = useMemo(() => getAvailableYears(entries), [entries]);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | 'all'>('all');

  const filteredEntries = useMemo(() => {
    if (selectedVehicleId === 'all') return entries;
    return entries.filter(e => e.vehicleId === selectedVehicleId);
  }, [entries, selectedVehicleId]);

  const yearEntries = useMemo(
    () => filteredEntries.filter(e => new Date(e.date).getFullYear() === selectedYear),
    [filteredEntries, selectedYear]
  );

  const totalCost = useMemo(() => getTotalCost(filteredEntries), [filteredEntries]);
  const yearCost = useMemo(() => getTotalCost(yearEntries), [yearEntries]);
  const avgMonthly = useMemo(() => getAvgMonthlyCost(filteredEntries, selectedYear), [filteredEntries, selectedYear]);
  const monthlyCosts = useMemo(() => getMonthlyStats(filteredEntries, selectedYear), [filteredEntries, selectedYear]);
  const categoryCosts = useMemo(() => getCostsByCategory(filteredEntries), [filteredEntries]);
  const yearlyCosts = useMemo(() => getYearlyCosts(filteredEntries), [filteredEntries]);
  const mileageHistory = useMemo(
    () => getMileageHistory(filteredEntries),
    [filteredEntries]
  );

  const vehicleCosts = useMemo(() => {
    return vehicles.map(v => {
      const vEntries = entries.filter(e => e.vehicleId === v.id);
      return {
        vehicle: v,
        total: getTotalCost(vEntries),
        yearTotal: getTotalCost(vEntries.filter(e => new Date(e.date).getFullYear() === selectedYear)),
        count: vEntries.length,
      };
    }).sort((a, b) => b.total - a.total);
  }, [vehicles, entries, selectedYear]);

  const maxVehicleCost = Math.max(...vehicleCosts.map(v => v.total), 1);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Statistiken</Text>
        <Text style={styles.subtitle}>Kosten & Verlauf</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Fahrzeug-Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <FilterChip
            label="Alle"
            active={selectedVehicleId === 'all'}
            onPress={() => setSelectedVehicleId('all')}
          />
          {vehicles.map(v => (
            <FilterChip
              key={v.id}
              label={v.name}
              active={selectedVehicleId === v.id}
              onPress={() => setSelectedVehicleId(v.id)}
              color={v.color}
            />
          ))}
        </ScrollView>

        {/* KPI-Karten */}
        <View style={styles.kpiRow}>
          <KPICard
            icon="cash"
            label="Gesamtkosten"
            value={formatCurrency(totalCost)}
            sub={`${filteredEntries.length} Einträge`}
            color={Colors.primary}
          />
          <KPICard
            icon="calendar"
            label={`${selectedYear}`}
            value={formatCurrency(yearCost)}
            sub={`Ø ${formatCurrency(avgMonthly)}/Monat`}
            color={Colors.success}
          />
        </View>

        {/* Jahres-Filter */}
        <View style={styles.yearRow}>
          {availableYears.map(y => (
            <TouchableOpacity
              key={y}
              style={[styles.yearChip, y === selectedYear && styles.yearChipActive]}
              onPress={() => setSelectedYear(y)}
            >
              <Text style={[styles.yearChipText, y === selectedYear && styles.yearChipTextActive]}>
                {y}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Monatsübersicht */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Monatliche Kosten {selectedYear}</Text>
          <BarChart
            data={monthlyCosts.map(m => ({
              label: m.month,
              value: m.total,
              color: Colors.primary,
            }))}
            height={120}
            formatValue={v => `${Math.round(v)}€`}
          />
        </View>

        {/* Kosten nach Kategorie */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Kosten nach Kategorie</Text>
          <Text style={styles.cardSub}>Gesamt: {formatCurrency(totalCost)}</Text>
          <DonutChart
            segments={categoryCosts.slice(0, 6).map(cs => ({
              label: CATEGORY_CONFIG[cs.category].label,
              value: cs.total,
              color: CATEGORY_CONFIG[cs.category].color,
            }))}
            total={totalCost}
          />
        </View>

        {/* Fahrzeugvergleich */}
        {vehicles.length > 1 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Kosten pro Fahrzeug</Text>
            {vehicleCosts.map(vc => (
              <View key={vc.vehicle.id} style={styles.vehicleCostRow}>
                <View style={[styles.vehicleColorDot, { backgroundColor: vc.vehicle.color }]} />
                <View style={styles.vehicleCostInfo}>
                  <View style={styles.vehicleCostHeader}>
                    <Text style={styles.vehicleCostName}>{vc.vehicle.name}</Text>
                    <Text style={styles.vehicleCostTotal}>{formatCurrency(vc.total)}</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${(vc.total / maxVehicleCost) * 100}%` as any,
                          backgroundColor: vc.vehicle.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.vehicleCostSub}>
                    {vc.count} Einträge · {formatCurrency(vc.yearTotal)} in {selectedYear}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Jahresübersicht */}
        {yearlyCosts.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Jahresübersicht</Text>
            <BarChart
              data={yearlyCosts.slice(0, 5).map(yc => ({
                label: String(yc.year),
                value: yc.total,
                color: yc.year === selectedYear ? Colors.primary : Colors.primaryLight,
              }))}
              height={100}
              formatValue={v => `${Math.round(v)}€`}
            />
            <View style={styles.yearSummaryList}>
              {yearlyCosts.map(yc => (
                <View key={yc.year} style={styles.yearSummaryRow}>
                  <Text style={[
                    styles.yearSummaryLabel,
                    yc.year === selectedYear && { color: Colors.primary, fontWeight: FontWeight.bold },
                  ]}>
                    {yc.year}
                  </Text>
                  <Text style={styles.yearSummaryCount}>{yc.count} Einträge</Text>
                  <Text style={[
                    styles.yearSummaryTotal,
                    yc.year === selectedYear && { color: Colors.primary },
                  ]}>
                    {formatCurrency(yc.total)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Kilometerstand-Verlauf */}
        {selectedVehicleId !== 'all' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Kilometerstand-Verlauf</Text>
            <MileageChart data={mileageHistory} height={100} />
          </View>
        )}

        {/* Top Ausgaben */}
        {filteredEntries.filter(e => e.cost != null).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Größte Ausgaben</Text>
            {filteredEntries
              .filter(e => e.cost != null && e.cost > 0)
              .sort((a, b) => (b.cost ?? 0) - (a.cost ?? 0))
              .slice(0, 5)
              .map((e, i) => {
                const cfg = CATEGORY_CONFIG[e.category];
                const v = vehicles.find(v => v.id === e.vehicleId);
                return (
                  <View key={e.id} style={styles.topCostRow}>
                    <Text style={styles.topCostRank}>#{i + 1}</Text>
                    <View style={[styles.topCostIcon, { backgroundColor: cfg.bgColor }]}>
                      <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
                    </View>
                    <View style={styles.topCostInfo}>
                      <Text style={styles.topCostLabel}>{cfg.label}</Text>
                      {v && <Text style={styles.topCostVehicle}>{v.name}</Text>}
                    </View>
                    <Text style={styles.topCostAmount}>{formatCurrency(e.cost)}</Text>
                  </View>
                );
              })}
          </View>
        )}

        {entries.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={64} color={Colors.border} />
            <Text style={styles.emptyTitle}>Noch keine Daten</Text>
            <Text style={styles.emptyText}>
              Trage Wartungen und Kosten ein, um hier deine Statistiken zu sehen.
            </Text>
          </View>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function KPICard({
  icon, label, value, sub, color,
}: {
  icon: any; label: string; value: string; sub: string; color: string;
}) {
  return (
    <View style={[styles.kpiCard, Shadow.small]}>
      <View style={[styles.kpiIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiSub}>{sub}</Text>
    </View>
  );
}

function FilterChip({
  label, active, onPress, color,
}: {
  label: string; active: boolean; onPress: () => void; color?: string;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.filterChip,
        active && { backgroundColor: color ?? Colors.primary },
      ]}
      onPress={onPress}
    >
      {color && !active && (
        <View style={[styles.filterDot, { backgroundColor: color }]} />
      )}
      <Text style={[styles.filterChipText, active && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 1 },
  scroll: { padding: Spacing.md, paddingTop: Spacing.sm },
  filterScroll: { marginBottom: Spacing.sm, marginHorizontal: -Spacing.md, paddingHorizontal: Spacing.md },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    marginRight: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterDot: { width: 8, height: 8, borderRadius: 4 },
  filterChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  kpiRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: 3,
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  kpiLabel: { fontSize: FontSize.xs, color: Colors.textTertiary },
  kpiValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  kpiSub: { fontSize: FontSize.xs, color: Colors.textTertiary },
  yearRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  yearChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  yearChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  yearChipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  yearChipTextActive: { color: '#fff' },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.small,
    gap: Spacing.sm,
  },
  cardTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  cardSub: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: -Spacing.xs },
  vehicleCostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  vehicleColorDot: { width: 12, height: 12, borderRadius: 6, flexShrink: 0 },
  vehicleCostInfo: { flex: 1 },
  vehicleCostHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vehicleCostName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  vehicleCostTotal: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text },
  progressBar: {
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginVertical: 4,
  },
  progressFill: { height: '100%', borderRadius: BorderRadius.full },
  vehicleCostSub: { fontSize: FontSize.xs, color: Colors.textTertiary },
  yearSummaryList: { gap: 0 },
  yearSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  yearSummaryLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, width: 48 },
  yearSummaryCount: { flex: 1, fontSize: FontSize.xs, color: Colors.textTertiary },
  yearSummaryTotal: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  topCostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  topCostRank: { fontSize: FontSize.xs, color: Colors.textTertiary, width: 20, textAlign: 'center' },
  topCostIcon: { width: 28, height: 28, borderRadius: BorderRadius.sm, justifyContent: 'center', alignItems: 'center' },
  topCostInfo: { flex: 1 },
  topCostLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.text },
  topCostVehicle: { fontSize: FontSize.xs, color: Colors.textTertiary },
  topCostAmount: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.text },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.xl },
});
