import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Vehicle, VehicleEntry } from '../types';
import { StatusBadge } from './StatusBadge';
import {
  computeVehicleStatus,
  formatDaysUntil,
  formatRelativeDate,
  formatMileage,
} from '../utils/calculations';
import { FUEL_TYPE_LABELS } from '../constants/categories';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../constants/theme';

interface Props {
  vehicle: Vehicle;
  entries: VehicleEntry[];
  onPress: () => void;
}

export function VehicleCard({ vehicle, entries, onPress }: Props) {
  const status = computeVehicleStatus(vehicle, entries);

  const urgentLevel =
    status.tuev.level === 'overdue' || status.service.level === 'overdue'
      ? 'overdue'
      : status.tuev.level === 'danger' || status.service.level === 'danger'
      ? 'danger'
      : status.tuev.level === 'warning' || status.service.level === 'warning'
      ? 'warning'
      : 'ok';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.header}>
        <View style={[styles.colorDot, { backgroundColor: vehicle.color }]} />
        <View style={styles.headerInfo}>
          <Text style={styles.vehicleName}>{vehicle.name}</Text>
          <Text style={styles.vehicleSubtitle}>
            {vehicle.brand} {vehicle.model} · {vehicle.year}
          </Text>
        </View>
        <StatusBadge
          level={urgentLevel}
          label={urgentLevel === 'ok' ? 'Alles OK' : 'Prüfen'}
          size="sm"
        />
      </View>

      <View style={styles.plate}>
        <Text style={styles.plateText}>{vehicle.licensePlate}</Text>
        <Text style={styles.mileage}>{formatMileage(vehicle.mileage)}</Text>
        <View style={[styles.fuelBadge, { backgroundColor: Colors.primaryLight }]}>
          <Text style={[styles.fuelText, { color: Colors.primary }]}>
            {FUEL_TYPE_LABELS[vehicle.fuelType]}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.stats}>
        <StatItem
          icon="shield-checkmark"
          label="TÜV"
          value={
            status.tuev.daysUntil !== undefined
              ? formatDaysUntil(status.tuev.daysUntil)
              : '–'
          }
          level={status.tuev.level}
        />
        <StatItem
          icon="construct"
          label="Service"
          value={
            status.service.daysUntil !== undefined
              ? formatDaysUntil(status.service.daysUntil)
              : '–'
          }
          level={status.service.level}
        />
        <StatItem
          icon="sparkles"
          label="Wäsche"
          value={
            status.lastWash.daysAgo !== undefined
              ? formatRelativeDate(status.lastWash.date)
              : 'Keine'
          }
          level={status.lastWash.level}
        />
      </View>
    </TouchableOpacity>
  );
}

interface StatItemProps {
  icon: any;
  label: string;
  value: string;
  level: string;
}

function StatItem({ icon, label, value, level }: StatItemProps) {
  const color =
    level === 'overdue' || level === 'danger'
      ? Colors.danger
      : level === 'warning'
      ? Colors.warning
      : Colors.textSecondary;

  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: Spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  vehicleSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  plate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  plateText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mileage: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  fuelBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  fuelText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginBottom: Spacing.sm,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  statValue: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
  },
});
