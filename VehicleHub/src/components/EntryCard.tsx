import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VehicleEntry } from '../types';
import { CATEGORY_CONFIG } from '../constants/categories';
import { formatDate, formatRelativeDate, formatCurrency, formatMileage } from '../utils/calculations';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../constants/theme';

interface Props {
  entry: VehicleEntry;
  onDelete?: () => void;
}

export function EntryCard({ entry, onDelete }: Props) {
  const config = CATEGORY_CONFIG[entry.category];

  return (
    <View style={styles.container}>
      <View style={[styles.iconBox, { backgroundColor: config.bgColor }]}>
        <Ionicons name={config.icon as any} size={20} color={config.color} />
      </View>

      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.category}>{config.label}</Text>
          <Text style={styles.date}>{formatDate(entry.date)}</Text>
        </View>
        <Text style={styles.relative}>{formatRelativeDate(entry.date)}</Text>

        <View style={styles.meta}>
          {entry.mileage !== undefined && (
            <MetaChip icon="speedometer-outline" value={formatMileage(entry.mileage)} />
          )}
          {entry.cost !== undefined && (
            <MetaChip icon="cash-outline" value={formatCurrency(entry.cost)} />
          )}
          {entry.nextDueDate && (
            <MetaChip icon="calendar-outline" value={`Nächstes: ${formatDate(entry.nextDueDate)}`} />
          )}
        </View>

        {entry.note ? <Text style={styles.note}>{entry.note}</Text> : null}
      </View>

      {onDelete && (
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} hitSlop={8}>
          <Ionicons name="trash-outline" size={16} color={Colors.textTertiary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function MetaChip({ icon, value }: { icon: any; value: string }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={11} color={Colors.textSecondary} />
      <Text style={styles.chipText}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    flexShrink: 0,
  },
  content: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  date: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  relative: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 1,
    marginBottom: Spacing.xs,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  chipText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  note: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  deleteBtn: {
    padding: 4,
    marginLeft: Spacing.sm,
  },
});
