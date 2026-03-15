import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../constants/theme';

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface Props {
  data: BarData[];
  height?: number;
  formatValue?: (v: number) => string;
  showValues?: boolean;
}

export function BarChart({ data, height = 140, formatValue, showValues = true }: Props) {
  if (data.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>Keine Daten</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <View style={styles.container}>
      <View style={[styles.chartArea, { height }]}>
        {data.map((item, i) => {
          const barHeight = maxValue > 0 ? (item.value / maxValue) * (height - 24) : 0;
          const color = item.color ?? Colors.primary;
          return (
            <View key={i} style={styles.barWrapper}>
              <View style={[styles.barContainer, { height: height - 24 }]}>
                {showValues && item.value > 0 && (
                  <Text style={styles.barValue} numberOfLines={1}>
                    {formatValue ? formatValue(item.value) : Math.round(item.value)}
                  </Text>
                )}
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(barHeight, item.value > 0 ? 4 : 0),
                      backgroundColor: color,
                      opacity: item.value > 0 ? 1 : 0.15,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel} numberOfLines={1}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '80%',
    borderRadius: BorderRadius.sm,
    minWidth: 8,
  },
  barValue: {
    fontSize: 9,
    color: Colors.textTertiary,
    marginBottom: 2,
    textAlign: 'center',
  },
  barLabel: {
    fontSize: 9,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 4,
    width: '100%',
  },
  empty: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
});
