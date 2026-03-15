import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EntryCategory } from '../types';
import { CATEGORY_CONFIG } from '../constants/categories';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

interface Props {
  category: EntryCategory;
  onPress: () => void;
}

export function QuickActionButton({ category, onPress }: Props) {
  const config = CATEGORY_CONFIG[category];

  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: config.bgColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={config.icon as any} size={18} color={config.color} />
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});
