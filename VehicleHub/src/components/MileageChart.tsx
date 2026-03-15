import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import { formatDate, formatMileage } from '../utils/calculations';

interface Point {
  date: string;
  mileage: number;
}

interface Props {
  data: Point[];
  height?: number;
}

export function MileageChart({ data, height = 100 }: Props) {
  if (data.length < 2) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>
          {data.length === 0
            ? 'Noch keine Kilometerstand-Einträge'
            : 'Mindestens 2 Einträge für Verlauf benötigt'}
        </Text>
      </View>
    );
  }

  const minKm = Math.min(...data.map(d => d.mileage));
  const maxKm = Math.max(...data.map(d => d.mileage));
  const range = maxKm - minKm || 1;

  return (
    <View style={styles.container}>
      <View style={[styles.chartArea, { height }]}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.axisLabel}>{formatMileage(maxKm)}</Text>
          <Text style={styles.axisLabel}>{formatMileage(minKm)}</Text>
        </View>

        {/* Line chart as connected dots */}
        <View style={styles.lineArea}>
          {data.map((point, i) => {
            const x = i / (data.length - 1);
            const y = 1 - (point.mileage - minKm) / range;
            const nextPoint = data[i + 1];

            return (
              <React.Fragment key={i}>
                {/* Dot */}
                <View
                  style={[
                    styles.dot,
                    {
                      left: `${x * 100}%` as any,
                      top: `${y * 100}%` as any,
                    },
                  ]}
                />
                {/* Connecting bar (simplified) */}
                {nextPoint && (
                  <View
                    style={[
                      styles.connector,
                      {
                        left: `${x * 100}%` as any,
                        top: `${y * 100}%` as any,
                        width: `${(1 / (data.length - 1)) * 100}%` as any,
                      },
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>
      </View>

      {/* X-axis: first and last date */}
      <View style={styles.xAxis}>
        <Text style={styles.axisLabel}>{formatDate(data[0].date)}</Text>
        <Text style={styles.axisLabel}>{formatDate(data[data.length - 1].date)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  chartArea: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  yAxis: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 4,
  },
  lineArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: -4,
    marginTop: -4,
  },
  connector: {
    position: 'absolute',
    height: 2,
    backgroundColor: Colors.primary,
    opacity: 0.5,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  axisLabel: {
    fontSize: 9,
    color: Colors.textTertiary,
  },
  empty: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});
