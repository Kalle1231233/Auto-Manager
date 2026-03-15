import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useVehicles } from '../hooks/useVehicles';
import { useEntries } from '../hooks/useEntries';
import { useTrips } from '../hooks/useTrips';
import { useBusinessSettings } from '../hooks/useBusinessSettings';
import { BarChart } from '../components/BarChart';
import {
  getBusinessSummary,
  getTripSummary,
  generateBusinessCSV,
} from '../utils/business';
import { getMonthlyStats, getAvailableYears } from '../utils/stats';
import { formatCurrency, formatDate, formatMileage } from '../utils/calculations';
import { CATEGORY_CONFIG } from '../constants/categories';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../constants/theme';
import { RootStackParamList } from '../types';

type Nav = StackNavigationProp<RootStackParamList>;

export function BusinessScreen() {
  const navigation = useNavigation<Nav>();
  const { vehicles } = useVehicles();
  const { entries } = useEntries();
  const { trips } = useTrips();
  const { settings, updateSettings } = useBusinessSettings();

  const availableYears = useMemo(() => getAvailableYears(entries), [entries]);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | 'all'>('all');

  const filteredEntries = useMemo(() =>
    selectedVehicleId === 'all' ? entries : entries.filter(e => e.vehicleId === selectedVehicleId),
    [entries, selectedVehicleId]
  );
  const filteredTrips = useMemo(() =>
    selectedVehicleId === 'all' ? trips : trips.filter(t => t.vehicleId === selectedVehicleId),
    [trips, selectedVehicleId]
  );

  const yearEntries = useMemo(() =>
    filteredEntries.filter(e => new Date(e.date).getFullYear() === selectedYear),
    [filteredEntries, selectedYear]
  );
  const yearTrips = useMemo(() =>
    filteredTrips.filter(t => new Date(t.date).getFullYear() === selectedYear),
    [filteredTrips, selectedYear]
  );

  const summary = useMemo(() => getBusinessSummary(yearEntries), [yearEntries]);
  const tripSummary = useMemo(() => getTripSummary(yearTrips), [yearTrips]);

  const monthlyBusiness = useMemo(() =>
    getMonthlyStats(yearEntries.filter(e => e.isBusinessExpense), selectedYear),
    [yearEntries, selectedYear]
  );

  const businessEntries = useMemo(() =>
    yearEntries
      .filter(e => e.isBusinessExpense && e.cost != null && e.cost > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [yearEntries]
  );

  const handleExport = async () => {
    const allEntries = selectedVehicleId === 'all' ? entries : filteredEntries;
    const allTrips = selectedVehicleId === 'all' ? trips : filteredTrips;
    const csv = generateBusinessCSV(allEntries, allTrips, selectedYear, settings.companyName, settings.vatId);
    const filename = `geschaeftsbericht_${selectedYear}.csv`;

    if (Platform.OS === 'web') {
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }
    try {
      const FileSystem = await import('expo-file-system');
      const Sharing = await import('expo-sharing');
      const fs = FileSystem as any;
      const path = `${fs.documentDirectory ?? fs.default?.documentDirectory}${filename}`;
      const write = fs.writeAsStringAsync ?? fs.default?.writeAsStringAsync;
      await write(path, csv, { encoding: 'utf8' });
      const share = (Sharing.default ?? Sharing) as any;
      await share.shareAsync(path, { mimeType: 'text/csv' });
    } catch (e) {
      Alert.alert('Export fehlgeschlagen', String(e));
    }
  };

  if (!settings.enabled) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Geschäftskonto</Text>
        </View>
        <View style={styles.enableContainer}>
          <View style={styles.enableIcon}>
            <Ionicons name="business" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.enableTitle}>Business-Modus aktivieren</Text>
          <Text style={styles.enableText}>
            Verwalte geschäftliche Fahrzeugkosten steuerkonform.{'\n'}
            MwSt-Tracking, Vorsteuer-Auswertung, Fahrtenprotokoll{'\n'}und Jahresbericht für den Steuerberater.
          </Text>
          <TouchableOpacity
            style={styles.enableBtn}
            onPress={() => updateSettings({ enabled: true })}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.enableBtnText}>Business-Modus aktivieren</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Geschäftskonto</Text>
          {settings.companyName ? (
            <Text style={styles.companyName}>{settings.companyName}</Text>
          ) : null}
        </View>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
          <Ionicons name="download-outline" size={18} color={Colors.primary} />
          <Text style={styles.exportBtnText}>Export {selectedYear}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <FilterChip label="Alle" active={selectedVehicleId === 'all'} onPress={() => setSelectedVehicleId('all')} />
          {vehicles.map(v => (
            <FilterChip key={v.id} label={v.name} active={selectedVehicleId === v.id}
              onPress={() => setSelectedVehicleId(v.id)} color={v.color} />
          ))}
        </ScrollView>

        {/* Jahr-Filter */}
        <View style={styles.yearRow}>
          {availableYears.map(y => (
            <TouchableOpacity key={y} style={[styles.yearChip, y === selectedYear && styles.yearChipActive]}
              onPress={() => setSelectedYear(y)}>
              <Text style={[styles.yearChipText, y === selectedYear && styles.yearChipTextActive]}>{y}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Steuer-KPIs */}
        <View style={styles.kpiGrid}>
          <KPIBox icon="receipt" label="Absetzbar (Brutto)" value={formatCurrency(summary.deductibleGross)} color={Colors.primary} />
          <KPIBox icon="return-up-back" label="Vorsteuer" value={formatCurrency(summary.deductibleVat)} color={Colors.success} />
          <KPIBox icon="car" label="Geschäfts-km" value={`${tripSummary.businessKm} km`} color={Colors.primary} />
          <KPIBox icon="pie-chart" label="Biz-Anteil Fahrten" value={`${tripSummary.businessRatio}%`} color={Colors.success} />
        </View>

        {/* Zusammenfassung */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Steuer-Zusammenfassung {selectedYear}</Text>
          <SummaryRow label="Gesamtausgaben (Brutto)" value={formatCurrency(summary.totalGross)} />
          <SummaryRow label="Davon Netto" value={formatCurrency(summary.totalNet)} />
          <SummaryRow label="Enthaltene MwSt gesamt" value={formatCurrency(summary.totalVat)} />
          <View style={styles.summaryDivider} />
          <SummaryRow label="Geschäftlich absetzbar" value={formatCurrency(summary.deductibleGross)} highlight />
          <SummaryRow label="Abzugsfähige Vorsteuer" value={formatCurrency(summary.deductibleVat)} highlight color={Colors.success} />
          <SummaryRow label="Privater Anteil" value={formatCurrency(summary.privateGross)} />
          <View style={styles.summaryDivider} />
          <SummaryRow label="Belege (gesamt / geschäftl.)" value={`${summary.entryCount} / ${summary.businessEntryCount}`} />
        </View>

        {/* Monatliche Geschäftskosten */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Monatliche Geschäftskosten</Text>
          <BarChart
            data={monthlyBusiness.map(m => ({ label: m.month, value: m.total, color: Colors.primary }))}
            height={110}
            formatValue={v => `${Math.round(v)}€`}
          />
        </View>

        {/* Fahrtenprotokoll */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Fahrtenprotokoll</Text>
            {vehicles.length > 0 && (
              <TouchableOpacity
                style={styles.addTripBtn}
                onPress={() => navigation.navigate('AddTrip', {
                  vehicleId: selectedVehicleId !== 'all' ? selectedVehicleId : vehicles[0].id
                })}
              >
                <Ionicons name="add" size={16} color={Colors.primary} />
                <Text style={styles.addTripText}>Fahrt</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.tripStats}>
            <TripStat label="Gesamt-km" value={`${tripSummary.totalKm} km`} />
            <TripStat label="Geschäftlich" value={`${tripSummary.businessKm} km`} color={Colors.primary} />
            <TripStat label="Privat" value={`${tripSummary.privateKm} km`} color={Colors.textSecondary} />
          </View>

          {tripSummary.totalKm > 0 && (
            <View style={styles.tripBar}>
              <View style={[styles.tripBarBusiness, {
                flex: tripSummary.businessKm,
                backgroundColor: Colors.primary,
              }]} />
              <View style={[styles.tripBarPrivate, {
                flex: tripSummary.privateKm,
                backgroundColor: Colors.border,
              }]} />
            </View>
          )}

          {yearTrips.length === 0 ? (
            <Text style={styles.noData}>Noch keine Fahrten eingetragen.</Text>
          ) : (
            yearTrips.slice(0, 8).map(trip => {
              const vehicle = vehicles.find(v => v.id === trip.vehicleId);
              return (
                <View key={trip.id} style={styles.tripRow}>
                  <View style={[styles.tripTypeDot, {
                    backgroundColor: trip.isBusinessTrip ? Colors.primary : Colors.border,
                  }]} />
                  <View style={styles.tripInfo}>
                    <Text style={styles.tripDestination}>{trip.destination}</Text>
                    <Text style={styles.tripMeta}>
                      {formatDate(trip.date)} · {trip.distance} km
                      {vehicle ? ` · ${vehicle.name}` : ''}
                    </Text>
                    {trip.purpose ? <Text style={styles.tripPurpose}>{trip.purpose}</Text> : null}
                  </View>
                  <Text style={[styles.tripType, { color: trip.isBusinessTrip ? Colors.primary : Colors.textTertiary }]}>
                    {trip.isBusinessTrip ? 'Biz' : 'Priv'}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* Belege */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Geschäftliche Belege {selectedYear}</Text>
          {businessEntries.length === 0 ? (
            <Text style={styles.noData}>
              Noch keine Belege als geschäftlich markiert.{'\n'}
              Füge beim Eintrag „Geschäftliche Ausgabe" an.
            </Text>
          ) : (
            businessEntries.map(e => {
              const cfg = CATEGORY_CONFIG[e.category];
              const vehicle = vehicles.find(v => v.id === e.vehicleId);
              const deductible = e.cost! * (e.businessRatio ?? 100) / 100;
              const vatAmount = e.vatRate ? deductible / (1 + e.vatRate / 100) * (e.vatRate / 100) : 0;
              return (
                <View key={e.id} style={styles.receiptRow}>
                  <View style={[styles.receiptIcon, { backgroundColor: cfg.bgColor }]}>
                    <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
                  </View>
                  <View style={styles.receiptInfo}>
                    <View style={styles.receiptHeader}>
                      <Text style={styles.receiptLabel}>
                        {cfg.label}{e.supplier ? ` · ${e.supplier}` : ''}
                      </Text>
                      <Text style={styles.receiptAmount}>{formatCurrency(deductible)}</Text>
                    </View>
                    <Text style={styles.receiptMeta}>
                      {formatDate(e.date)}
                      {vehicle ? ` · ${vehicle.name}` : ''}
                      {e.receiptNumber ? ` · ${e.receiptNumber}` : ''}
                    </Text>
                    {e.vatRate != null && e.vatRate > 0 && (
                      <Text style={styles.receiptVat}>
                        Vorsteuer: {formatCurrency(vatAmount)} ({e.vatRate}%)
                        {e.businessRatio && e.businessRatio < 100 ? ` · ${e.businessRatio}% gesch.` : ''}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function KPIBox({ icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <View style={[styles.kpiBox, Shadow.small]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function SummaryRow({ label, value, highlight, color }: { label: string; value: string; highlight?: boolean; color?: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, highlight && { fontWeight: FontWeight.bold, color: color ?? Colors.primary }]}>{value}</Text>
    </View>
  );
}

function TripStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.tripStatItem}>
      <Text style={[styles.tripStatValue, color && { color }]}>{value}</Text>
      <Text style={styles.tripStatLabel}>{label}</Text>
    </View>
  );
}

function FilterChip({ label, active, onPress, color }: { label: string; active: boolean; onPress: () => void; color?: string }) {
  return (
    <TouchableOpacity style={[styles.chip, active && { backgroundColor: color ?? Colors.primary }]} onPress={onPress}>
      {color && !active && <View style={[styles.chipDot, { backgroundColor: color }]} />}
      <Text style={[styles.chipText, active && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  companyName: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 1 },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primaryLight, paddingHorizontal: Spacing.sm,
    paddingVertical: 6, borderRadius: BorderRadius.full,
  },
  exportBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },
  scroll: { padding: Spacing.md, paddingTop: Spacing.sm },
  filterScroll: { marginBottom: Spacing.sm, marginHorizontal: -Spacing.md, paddingHorizontal: Spacing.md },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.sm, paddingVertical: 6,
    borderRadius: BorderRadius.full, backgroundColor: Colors.surface,
    marginRight: Spacing.xs, borderWidth: 1, borderColor: Colors.border,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  yearRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md, flexWrap: 'wrap' },
  yearChip: {
    paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  yearChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  yearChipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  yearChipTextActive: { color: '#fff' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  kpiBox: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.sm, width: '47%', gap: 3,
  },
  kpiValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  kpiLabel: { fontSize: FontSize.xs, color: Colors.textTertiary },
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.small,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  cardTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, alignItems: 'center' },
  summaryLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  summaryValue: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.medium },
  summaryDivider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 4 },
  tripStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.sm },
  tripStatItem: { alignItems: 'center' },
  tripStatValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  tripStatLabel: { fontSize: FontSize.xs, color: Colors.textTertiary },
  tripBar: { flexDirection: 'row', height: 8, borderRadius: BorderRadius.full, overflow: 'hidden', marginBottom: Spacing.md },
  tripBarBusiness: { height: '100%' },
  tripBarPrivate: { height: '100%' },
  addTripBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryLight, paddingHorizontal: Spacing.sm,
    paddingVertical: 4, borderRadius: BorderRadius.full,
  },
  addTripText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  tripRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  tripTypeDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
  tripInfo: { flex: 1 },
  tripDestination: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  tripMeta: { fontSize: FontSize.xs, color: Colors.textTertiary },
  tripPurpose: { fontSize: FontSize.xs, color: Colors.textSecondary, fontStyle: 'italic' },
  tripType: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  receiptRow: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  receiptIcon: { width: 30, height: 30, borderRadius: BorderRadius.sm, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  receiptInfo: { flex: 1 },
  receiptHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  receiptLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text, flex: 1 },
  receiptAmount: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
  receiptMeta: { fontSize: FontSize.xs, color: Colors.textTertiary },
  receiptVat: { fontSize: FontSize.xs, color: Colors.success, marginTop: 1 },
  noData: { fontSize: FontSize.sm, color: Colors.textTertiary, textAlign: 'center', paddingVertical: Spacing.md, lineHeight: 20 },
  enableContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl, gap: Spacing.md },
  enableIcon: { width: 100, height: 100, borderRadius: 25, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center', ...Shadow.medium },
  enableTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text, textAlign: 'center' },
  enableText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  enableBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, marginTop: Spacing.sm, ...Shadow.medium },
  enableBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
