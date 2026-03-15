import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useVehicles } from '../hooks/useVehicles';
import { useEntries } from '../hooks/useEntries';
import { VehicleCard } from '../components/VehicleCard';
import { ReminderBox } from '../components/ReminderBox';
import { SectionHeader } from '../components/SectionHeader';
import {
  computeVehicleStatus,
  getUrgentWarnings,
  formatRelativeDate,
} from '../utils/calculations';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../constants/theme';
import { RootStackParamList } from '../types';

type Nav = StackNavigationProp<RootStackParamList>;

export function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { vehicles, loading: vLoading } = useVehicles();
  const { entries, loading: eLoading } = useEntries();

  const allWarnings = useMemo(() => {
    const list: { vehicleName: string; warning: string; level: 'warning' | 'danger' | 'overdue' }[] = [];
    vehicles.forEach(v => {
      const warns = getUrgentWarnings(v, entries);
      const status = computeVehicleStatus(v, entries);
      warns.forEach(w => {
        const tuevLevel = status.tuev.level;
        const level =
          tuevLevel === 'overdue' || status.service.level === 'overdue'
            ? 'overdue'
            : tuevLevel === 'danger' || status.service.level === 'danger'
            ? 'danger'
            : 'warning';
        list.push({ vehicleName: v.name, warning: w, level });
      });
    });
    return list.sort((a, b) => {
      const order = { overdue: 0, danger: 1, warning: 2 };
      return order[a.level] - order[b.level];
    });
  }, [vehicles, entries]);

  const recentEntries = useMemo(() => {
    return [...entries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [entries]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Guten Morgen';
    if (h < 18) return 'Guten Tag';
    return 'Guten Abend';
  }, []);

  if (vLoading || eLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="car" size={48} color={Colors.primary} />
          <Text style={styles.loadingText}>Lade VehicleHub…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.headerTitle}>VehicleHub</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddVehicle', {})}
          >
            <Ionicons name="add" size={22} color={Colors.textInverse} />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard
            icon="car"
            value={String(vehicles.length)}
            label="Fahrzeuge"
            color={Colors.primary}
          />
          <StatCard
            icon="alert-circle"
            value={String(allWarnings.length)}
            label="Warnungen"
            color={allWarnings.length > 0 ? Colors.danger : Colors.success}
          />
          <StatCard
            icon="document-text"
            value={String(entries.length)}
            label="Einträge"
            color={Colors.success}
          />
        </View>

        {/* Warnings */}
        {allWarnings.length > 0 && (
          <>
            <SectionHeader title="Wichtige Hinweise" />
            {allWarnings.map((w, i) => (
              <ReminderBox
                key={i}
                level={w.level}
                title={`${w.vehicleName}: ${w.warning}`}
                icon={w.level === 'overdue' ? 'warning' : 'alert-circle'}
              />
            ))}
          </>
        )}

        {allWarnings.length === 0 && vehicles.length > 0 && (
          <ReminderBox
            level="ok"
            title="Alles im grünen Bereich!"
            subtitle="Keine dringenden Termine oder Fälligkeiten."
          />
        )}

        {/* Vehicles */}
        <SectionHeader
          title="Meine Fahrzeuge"
          actionLabel={vehicles.length > 2 ? 'Alle sehen' : undefined}
        />
        {vehicles.length === 0 ? (
          <EmptyVehicles onAdd={() => navigation.navigate('AddVehicle', {})} />
        ) : (
          vehicles.map(v => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              entries={entries}
              onPress={() => navigation.navigate('VehicleDetail', { vehicleId: v.id })}
            />
          ))
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: any;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <View style={[styles.statCard, Shadow.small]}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function EmptyVehicles({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="car-outline" size={64} color={Colors.border} />
      <Text style={styles.emptyTitle}>Noch keine Fahrzeuge</Text>
      <Text style={styles.emptySubtitle}>Füge dein erstes Fahrzeug hinzu</Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={onAdd}>
        <Text style={styles.emptyBtnText}>Fahrzeug hinzufügen</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  scroll: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  greeting: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.small,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  emptyBtnText: {
    color: Colors.textInverse,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
});
