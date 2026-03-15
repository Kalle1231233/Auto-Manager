import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../constants/theme';
import { formatCurrency } from '../utils/calculations';

interface Segment {
  label: string;
  value: number;
  color: string;
}

interface Props {
  segments: Segment[];
  total: number;
  centerLabel?: string;
}

export function DonutChart({ segments, total, centerLabel }: Props) {
  if (segments.length === 0 || total === 0) {
    return (
      <View style={styles.emptyRow}>
        <Text style={styles.emptyText}>Keine Kostendaten vorhanden</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stacked progress-bar style donut substitute */}
      <View style={styles.progressContainer}>
        {segments.map((seg, i) => {
          const pct = total > 0 ? (seg.value / total) * 100 : 0;
          return (
            <View
              key={i}
              style={[
                styles.progressSegment,
                { flex: pct, backgroundColor: seg.color },
                i === 0 && styles.firstSegment,
                i === segments.length - 1 && styles.lastSegment,
              ]}
            />
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {segments.map((seg, i) => {
          const pct = total > 0 ? ((seg.value / total) * 100).toFixed(0) : '0';
          return (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
              <View style={styles.legendText}>
                <Text style={styles.legendLabel} numberOfLines={1}>{seg.label}</Text>
                <Text style={styles.legendValue}>{formatCurrency(seg.value)} · {pct}%</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  progressContainer: {
    flexDirection: 'row',
    height: 16,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    backgroundColor: Colors.borderLight,
    gap: 1,
  },
  progressSegment: {
    height: '100%',
  },
  firstSegment: {
    borderTopLeftRadius: BorderRadius.full,
    borderBottomLeftRadius: BorderRadius.full,
  },
  lastSegment: {
    borderTopRightRadius: BorderRadius.full,
    borderBottomRightRadius: BorderRadius.full,
  },
  legend: {
    gap: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    flexShrink: 0,
  },
  legendText: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendLabel: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: FontWeight.medium,
    flex: 1,
  },
  legendValue: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  emptyRow: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
});
