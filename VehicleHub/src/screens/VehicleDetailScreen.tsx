import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useVehicles } from '../hooks/useVehicles';
import { useEntries } from '../hooks/useEntries';
import { useEmployees } from '../hooks/useEmployees';
import { useDocuments } from '../hooks/useDocuments';
import { EntryCard } from '../components/EntryCard';
import { StatusBadge } from '../components/StatusBadge';
import { ReminderBox } from '../components/ReminderBox';
import { QuickActionButton } from '../components/QuickActionButton';
import {
  computeVehicleStatus,
  formatDate,
  formatDaysUntil,
  formatRelativeDate,
  formatMileage,
  formatCurrency,
  getUrgentWarnings,
} from '../utils/calculations';
import { exportVehicleCSV } from '../utils/export';
import { CATEGORY_CONFIG, FUEL_TYPE_LABELS } from '../constants/categories';
import { DOCUMENT_CONFIG } from '../constants/employees';
import { getDaysUntil, formatDate as fmtDate } from '../utils/calculations';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../constants/theme';
import { RootStackParamList, EntryCategory } from '../types';

type Nav = StackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'VehicleDetail'>;

const QUICK_CATEGORIES: EntryCategory[] = ['waesche', 'oelwechsel', 'service', 'tuev', 'reifenwechsel'];

export function VehicleDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { vehicleId } = route.params;

  const { getVehicle, deleteVehicle } = useVehicles();
  const { getEntriesForVehicle, deleteEntry } = useEntries();
  const { employees } = useEmployees();
  const { getDocumentsForVehicle, deleteDocument } = useDocuments();

  const vehicle = getVehicle(vehicleId);
  const entries = useMemo(() => getEntriesForVehicle(vehicleId), [vehicleId, getEntriesForVehicle]);

  const [filterCategory, setFilterCategory] = useState<EntryCategory | null>(null);

  if (!vehicle) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ padding: 20, color: Colors.text }}>Fahrzeug nicht gefunden.</Text>
      </SafeAreaView>
    );
  }

  const status = computeVehicleStatus(vehicle, entries);
  const warnings = getUrgentWarnings(vehicle, entries);

  const filteredEntries = filterCategory
    ? entries.filter(e => e.category === filterCategory)
    : entries;

  const totalCost = entries.reduce((sum, e) => sum + (e.cost ?? 0), 0);
  const documents = useMemo(() => getDocumentsForVehicle(vehicleId), [vehicleId, getDocumentsForVehicle]);
  const assignee = vehicle?.assigneeId ? employees.find(e => e.id === vehicle.assigneeId) : undefined;

  const handleDelete = () => {
    Alert.alert(
      'Fahrzeug löschen',
      `Möchtest du "${vehicle.name}" wirklich löschen? Alle Einträge bleiben erhalten.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            await deleteVehicle(vehicleId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Header */}
        <View style={[styles.hero, { backgroundColor: vehicle.color }]}>
          <View style={styles.heroNav}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
          <View style={styles.heroActions}>
            <TouchableOpacity
              onPress={() => navigation.navigate('AddVehicle', { vehicleId })}
              style={styles.backBtn}
            >
              <Ionicons name="create-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => exportVehicleCSV(vehicle, entries)}
              style={styles.backBtn}
            >
              <Ionicons name="download-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          </View>
          {vehicle.imageBase64 && (
            <Image
              source={{ uri: `data:image/jpeg;base64,${vehicle.imageBase64}` }}
              style={styles.heroImage}
            />
          )}
          <Text style={styles.heroName}>{vehicle.name}</Text>
          <Text style={styles.heroSubtitle}>
            {vehicle.brand} {vehicle.model} · {vehicle.year}
          </Text>
          <View style={styles.heroRow}>
            <HeroBadge icon="card-outline" label={vehicle.licensePlate} />
            <HeroBadge icon="speedometer-outline" label={formatMileage(vehicle.mileage)} />
            <HeroBadge icon="flash-outline" label={FUEL_TYPE_LABELS[vehicle.fuelType]} />
          </View>
        </View>

        <View style={styles.content}>
          {/* Warnings */}
          {warnings.map((w, i) => (
            <ReminderBox key={i} level={status.tuev.level} title={w} />
          ))}

          {/* Status Cards */}
          <View style={styles.statusGrid}>
            <StatusCard
              icon="shield-checkmark"
              label="TÜV"
              value={formatDaysUntil(status.tuev.daysUntil)}
              sub={formatDate(status.tuev.date)}
              level={status.tuev.level}
              iconColor={CATEGORY_CONFIG.tuev.color}
              iconBg={CATEGORY_CONFIG.tuev.bgColor}
            />
            <StatusCard
              icon="construct"
              label="Service"
              value={
                status.service.daysUntil !== undefined
                  ? formatDaysUntil(status.service.daysUntil)
                  : status.service.mileageUntil !== undefined
                  ? `${status.service.mileageUntil} km`
                  : '–'
              }
              sub={formatDate(status.service.date)}
              level={status.service.level}
              iconColor={CATEGORY_CONFIG.service.color}
              iconBg={CATEGORY_CONFIG.service.bgColor}
            />
            <StatusCard
              icon="sparkles"
              label="Letzte Wäsche"
              value={formatRelativeDate(status.lastWash.date)}
              sub={formatDate(status.lastWash.date)}
              level={status.lastWash.level}
              iconColor={CATEGORY_CONFIG.waesche.color}
              iconBg={CATEGORY_CONFIG.waesche.bgColor}
            />
            <StatusCard
              icon="water"
              label="Letztes Öl"
              value={formatRelativeDate(status.lastOilChange.date)}
              sub={status.lastOilChange.mileage ? formatMileage(status.lastOilChange.mileage) : '–'}
              level={status.lastOilChange.level}
              iconColor={CATEGORY_CONFIG.oelwechsel.color}
              iconBg={CATEGORY_CONFIG.oelwechsel.bgColor}
            />
          </View>

          {/* Aktueller Fahrer */}
          {assignee && (
            <View style={styles.assigneeCard}>
              <Ionicons name="person-circle" size={20} color={Colors.primary} />
              <View style={styles.assigneeInfo}>
                <Text style={styles.assigneeLabel}>Zugewiesen an</Text>
                <Text style={styles.assigneeName}>{assignee.name}</Text>
              </View>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Schnell eintragen</Text>
            <View style={styles.quickActions}>
              {QUICK_CATEGORIES.map(cat => (
                <QuickActionButton
                  key={cat}
                  category={cat}
                  onPress={() => navigation.navigate('AddEntry', { vehicleId, category: cat })}
                />
              ))}
              <QuickActionButton
                category="sonstiges"
                onPress={() => navigation.navigate('AddEntry', { vehicleId })}
              />
            </View>
          </View>

          {/* Stammdaten */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fahrzeugdaten</Text>
            <View style={styles.dataCard}>
              <DataRow label="Marke / Modell" value={`${vehicle.brand} ${vehicle.model}`} />
              <DataRow label="Baujahr" value={String(vehicle.year)} />
              <DataRow label="Kennzeichen" value={vehicle.licensePlate} />
              <DataRow label="Kilometerstand" value={formatMileage(vehicle.mileage)} />
              <DataRow label="Kraftstoff" value={FUEL_TYPE_LABELS[vehicle.fuelType]} />
              {vehicle.vin && <DataRow label="VIN" value={vehicle.vin} />}
              {vehicle.notes && <DataRow label="Notizen" value={vehicle.notes} />}
              <DataRow label="Gesamtkosten" value={formatCurrency(totalCost)} highlight />
            </View>
          </View>

          {/* Historie */}
          <View style={styles.section}>
            <View style={styles.historyHeader}>
              <Text style={styles.sectionTitle}>Historie ({entries.length})</Text>
              <TouchableOpacity
                style={styles.addEntryBtn}
                onPress={() => navigation.navigate('AddEntry', { vehicleId })}
              >
                <Ionicons name="add" size={16} color={Colors.primary} />
                <Text style={styles.addEntryText}>Eintrag</Text>
              </TouchableOpacity>
            </View>

            {/* Category Filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
            >
              <FilterChip
                label="Alle"
                active={filterCategory === null}
                onPress={() => setFilterCategory(null)}
              />
              {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
                const hasEntries = entries.some(e => e.category === key);
                if (!hasEntries) return null;
                return (
                  <FilterChip
                    key={key}
                    label={cfg.label}
                    active={filterCategory === key}
                    onPress={() => setFilterCategory(filterCategory === key ? null : key as EntryCategory)}
                    color={cfg.color}
                    bgColor={cfg.bgColor}
                  />
                );
              })}
            </ScrollView>

            {filteredEntries.length === 0 ? (
              <Text style={styles.noEntries}>Keine Einträge vorhanden.</Text>
            ) : (
              filteredEntries.map(entry => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onDelete={() =>
                    Alert.alert('Eintrag löschen', 'Diesen Eintrag wirklich löschen?', [
                      { text: 'Abbrechen', style: 'cancel' },
                      { text: 'Löschen', style: 'destructive', onPress: () => deleteEntry(entry.id) },
                    ])
                  }
                />
              ))
            )}
          </View>

          {/* Dokumente */}
          <View style={styles.section}>
            <View style={styles.historyHeader}>
              <Text style={styles.sectionTitle}>Dokumente ({documents.length})</Text>
              <TouchableOpacity
                style={styles.addEntryBtn}
                onPress={() => navigation.navigate('AddDocument', { vehicleId })}
              >
                <Ionicons name="add" size={16} color={Colors.primary} />
                <Text style={styles.addEntryText}>Dokument</Text>
              </TouchableOpacity>
            </View>
            {documents.length === 0 ? (
              <Text style={styles.noEntries}>Noch keine Dokumente hinterlegt.</Text>
            ) : (
              documents.map(doc => {
                const cfg = DOCUMENT_CONFIG[doc.type];
                const daysLeft = getDaysUntil(doc.expiryDate);
                const isExpiring = daysLeft != null && daysLeft < 60;
                const isExpired = daysLeft != null && daysLeft < 0;
                return (
                  <View key={doc.id} style={styles.docRow}>
                    <View style={[styles.docIcon, { backgroundColor: cfg.bgColor }]}>
                      <Ionicons name={cfg.icon as any} size={16} color={cfg.color} />
                    </View>
                    <View style={styles.docInfo}>
                      <Text style={styles.docTitle}>{doc.title}</Text>
                      <Text style={styles.docMeta}>
                        {doc.provider ?? cfg.label}
                        {doc.expiryDate ? ` · bis ${fmtDate(doc.expiryDate)}` : ''}
                      </Text>
                      {isExpired && <Text style={styles.docExpired}>ABGELAUFEN</Text>}
                      {!isExpired && isExpiring && (
                        <Text style={styles.docExpiring}>Läuft in {daysLeft} Tagen ab</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => Alert.alert('Dokument löschen', `"${doc.title}" wirklich löschen?`, [
                        { text: 'Abbrechen', style: 'cancel' },
                        { text: 'Löschen', style: 'destructive', onPress: () => deleteDocument(doc.id) },
                      ])}
                    >
                      <Ionicons name="trash-outline" size={16} color={Colors.textTertiary} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>

          {/* Delete Button */}
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={Colors.danger} />
            <Text style={styles.deleteBtnText}>Fahrzeug löschen</Text>
          </TouchableOpacity>

          <View style={{ height: Spacing.xxl }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HeroBadge({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.heroBadge}>
      <Ionicons name={icon} size={12} color="rgba(255,255,255,0.8)" />
      <Text style={styles.heroBadgeText}>{label}</Text>
    </View>
  );
}

interface StatusCardProps {
  icon: any;
  label: string;
  value: string;
  sub: string;
  level: string;
  iconColor: string;
  iconBg: string;
}

function StatusCard({ icon, label, value, sub, level, iconColor, iconBg }: StatusCardProps) {
  return (
    <View style={[styles.statusCard, Shadow.small]}>
      <View style={[styles.statusCardIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.statusCardLabel}>{label}</Text>
      <StatusBadge level={level as any} label={value} size="sm" />
      <Text style={styles.statusCardSub}>{sub}</Text>
    </View>
  );
}

function DataRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={[styles.dataValue, highlight && styles.dataValueHighlight]}>{value}</Text>
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
  color,
  bgColor,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  color?: string;
  bgColor?: string;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.filterChip,
        active && { backgroundColor: color ?? Colors.primary },
        !active && bgColor && { backgroundColor: bgColor },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterChipText,
          active ? { color: '#fff' } : { color: color ?? Colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  hero: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
    paddingTop: 50,
  },
  heroNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  heroActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  heroImage: {
    width: '100%',
    height: 160,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroName: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: '#fff',
  },
  heroSubtitle: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  heroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  heroBadgeText: {
    fontSize: FontSize.xs,
    color: '#fff',
    fontWeight: FontWeight.medium,
  },
  content: {
    padding: Spacing.md,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statusCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    width: '47%',
    alignItems: 'flex-start',
    gap: 4,
  },
  statusCardIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCardLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  statusCardSub: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dataCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    ...Shadow.small,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dataLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  dataValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  dataValueHighlight: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  addEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  addEntryText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  filterScroll: {
    marginBottom: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    marginRight: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  noEntries: {
    fontSize: FontSize.md,
    color: Colors.textTertiary,
    textAlign: 'center',
    padding: Spacing.xl,
  },
  assigneeCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primaryLight, padding: Spacing.sm,
    borderRadius: BorderRadius.md, marginBottom: Spacing.sm,
  },
  assigneeInfo: { flex: 1 },
  assigneeLabel: { fontSize: FontSize.xs, color: Colors.primary },
  assigneeName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.primary },
  docRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  docIcon: { width: 36, height: 36, borderRadius: BorderRadius.sm, justifyContent: 'center', alignItems: 'center' },
  docInfo: { flex: 1 },
  docTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  docMeta: { fontSize: FontSize.xs, color: Colors.textTertiary },
  docExpired: { fontSize: FontSize.xs, color: Colors.danger, fontWeight: FontWeight.bold },
  docExpiring: { fontSize: FontSize.xs, color: Colors.warning, fontWeight: FontWeight.semibold },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.danger,
    marginTop: Spacing.sm,
  },
  deleteBtnText: {
    color: Colors.danger,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
});
