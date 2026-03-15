import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusLevel } from '../types';
import { getStatusColor, getStatusBgColor } from '../utils/calculations';
import { Spacing, BorderRadius, FontSize, FontWeight } from '../constants/theme';

interface Props {
  icon?: any;
  level: StatusLevel;
  title: string;
  subtitle?: string;
}

export function ReminderBox({ icon, level, title, subtitle }: Props) {
  const color = getStatusColor(level);
  const bgColor = getStatusBgColor(level);

  return (
    <View style={[styles.box, { backgroundColor: bgColor, borderLeftColor: color }]}>
      <Ionicons
        name={icon ?? (level === 'ok' ? 'checkmark-circle' : 'alert-circle')}
        size={20}
        color={color}
        style={styles.icon}
      />
      <View style={styles.content}>
        <Text style={[styles.title, { color }]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    marginBottom: Spacing.sm,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: '#666',
    marginTop: 1,
  },
});
