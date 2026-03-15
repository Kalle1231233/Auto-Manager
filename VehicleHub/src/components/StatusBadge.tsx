import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusLevel } from '../types';
import { getStatusColor, getStatusBgColor } from '../utils/calculations';
import { FontSize, FontWeight, BorderRadius, Spacing } from '../constants/theme';

interface Props {
  level: StatusLevel;
  label: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ level, label, size = 'md' }: Props) {
  const color = getStatusColor(level);
  const bgColor = getStatusBgColor(level);
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }, isSmall && styles.badgeSm]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }, isSmall && styles.labelSm]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  labelSm: {
    fontSize: FontSize.xs,
  },
});
