import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useBusinessSettings } from '../hooks/useBusinessSettings';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../constants/theme';
import { VatRate } from '../types';

export function SettingsScreen() {
  const { settings, updateSettings } = useBusinessSettings();
  const handleResetData = () => {
    Alert.alert(
      'Alle Daten zurücksetzen',
      'Möchtest du wirklich alle Daten löschen und die Demo-Fahrzeuge wiederherstellen? Diese Aktion kann nicht rückgängig gemacht werden.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Zurücksetzen',
          style: 'destructive',
          onPress: async () => {
            const keys = [
              '@vehiclehub_vehicles',
              '@vehiclehub_entries',
              '@vehiclehub_initialized',
              '@vehiclehub_entries_initialized',
            ];
            for (const key of keys) {
              await AsyncStorage.removeItem(key);
            }
            Alert.alert('Erledigt', 'Daten wurden zurückgesetzt. Starte die App neu.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Einstellungen</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* App Info */}
        <View style={styles.appInfo}>
          <View style={styles.appIcon}>
            <Ionicons name="car-sport" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.appName}>VehicleHub</Text>
          <Text style={styles.appVersion}>Version 1.0.0 MVP</Text>
          <Text style={styles.appDesc}>
            Dein persönlicher Fahrzeug-Manager.{'\n'}Alle Wartungen, TÜV und Service auf einen Blick.
          </Text>
        </View>

        {/* Geschäftskonto */}
        <SettingsSection title="Geschäftskonto">
          <View style={styles.settingsRow}>
            <View style={[styles.itemIcon, { backgroundColor: `${Colors.primary}20` }]}>
              <Ionicons name="business" size={18} color={Colors.primary} />
            </View>
            <View style={styles.settingsRowContent}>
              <Text style={styles.settingsRowLabel}>Business-Modus</Text>
              <Text style={styles.settingsRowSub}>MwSt, Vorsteuer & Fahrtenprotokoll</Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={v => updateSettings({ enabled: v })}
              trackColor={{ true: Colors.primary }}
            />
          </View>
          {settings.enabled && (
            <>
              <BizField
                label="Unternehmensname"
                value={settings.companyName ?? ''}
                onChange={v => updateSettings({ companyName: v })}
                placeholder="Musterfirma GmbH"
              />
              <BizField
                label="USt-ID"
                value={settings.vatId ?? ''}
                onChange={v => updateSettings({ vatId: v })}
                placeholder="DE123456789"
                autoCapitalize="characters"
              />
              <View style={styles.bizField}>
                <Text style={styles.bizLabel}>Standard-MwSt-Satz</Text>
                <View style={styles.vatRow}>
                  {([0, 7, 19] as VatRate[]).map(rate => (
                    <TouchableOpacity
                      key={rate}
                      style={[styles.vatBtn, settings.defaultVatRate === rate && styles.vatBtnActive]}
                      onPress={() => updateSettings({ defaultVatRate: rate })}
                    >
                      <Text style={[styles.vatBtnText, settings.defaultVatRate === rate && { color: '#fff' }]}>
                        {rate}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <BizField
                label="Standard geschäftlicher Anteil"
                value={String(settings.defaultBusinessRatio)}
                onChange={v => updateSettings({ defaultBusinessRatio: parseInt(v) || 100 })}
                placeholder="100"
                keyboardType="number-pad"
                suffix="%"
              />
            </>
          )}
        </SettingsSection>

        {/* Data Management */}
        <SettingsSection title="Datenverwaltung">
          <SettingsItem
            icon="refresh"
            iconColor="#FF6D00"
            label="Demo-Daten zurücksetzen"
            subtitle="Alle Daten löschen und Beispiel-Fahrzeuge laden"
            onPress={handleResetData}
            destructive
          />
        </SettingsSection>

        {/* Features */}
        <SettingsSection title="Funktionen">
          <SettingsItem
            icon="shield-checkmark"
            iconColor={Colors.primary}
            label="TÜV-Warnung"
            subtitle="Warnung bei weniger als 30 Tagen"
            showArrow={false}
          />
          <SettingsItem
            icon="construct"
            iconColor="#FF6D00"
            label="Service-Erinnerung"
            subtitle="Basierend auf Datum und Kilometerstand"
            showArrow={false}
          />
          <SettingsItem
            icon="sparkles"
            iconColor="#03A9F4"
            label="Wäsche-Erinnerung"
            subtitle="Hinweis nach mehr als 30 Tagen"
            showArrow={false}
          />
        </SettingsSection>

        {/* About */}
        <SettingsSection title="Über die App">
          <SettingsItem
            icon="phone-portrait"
            iconColor={Colors.success}
            label="Expo Go / React Native"
            subtitle="Lokale Datenspeicherung mit AsyncStorage"
            showArrow={false}
          />
          <SettingsItem
            icon="code-slash"
            iconColor="#9C27B0"
            label="TypeScript"
            subtitle="Vollständig typisiert"
            showArrow={false}
          />
          <SettingsItem
            icon="server"
            iconColor={Colors.success}
            label="Kein Backend"
            subtitle="Alle Daten werden lokal gespeichert"
            showArrow={false}
          />
        </SettingsSection>

        <Text style={styles.footer}>
          Erstellt mit ❤️ für alle Autoliebhaber{'\n'}VehicleHub MVP · 2024
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function BizField({ label, value, onChange, placeholder, keyboardType, autoCapitalize, suffix }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: any; autoCapitalize?: any; suffix?: string;
}) {
  return (
    <View style={styles.bizField}>
      <Text style={styles.bizLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          style={styles.bizInput}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'sentences'}
        />
        {suffix && <Text style={{ fontSize: FontSize.sm, color: Colors.textTertiary, marginLeft: 4 }}>{suffix}</Text>}
      </View>
    </View>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

interface SettingsItemProps {
  icon: any;
  iconColor: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  destructive?: boolean;
  showArrow?: boolean;
}

function SettingsItem({
  icon,
  iconColor,
  label,
  subtitle,
  onPress,
  destructive,
  showArrow = true,
}: SettingsItemProps) {
  const content = (
    <View style={styles.item}>
      <View style={[styles.itemIcon, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemLabel, destructive && { color: Colors.danger }]}>{label}</Text>
        {subtitle && <Text style={styles.itemSub}>{subtitle}</Text>}
      </View>
      {showArrow && <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />}
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>;
  }
  return content;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  scroll: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.xs,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    ...Shadow.medium,
  },
  appName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  appVersion: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  appDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadow.small,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  itemIcon: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  itemSub: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  settingsRowContent: { flex: 1 },
  settingsRowLabel: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.text },
  settingsRowSub: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 1 },
  bizField: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  bizLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, marginBottom: 4 },
  bizInput: { fontSize: FontSize.md, color: Colors.text, flex: 1, paddingVertical: 2 },
  vatRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  vatBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: BorderRadius.full, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.background,
  },
  vatBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  vatBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  footer: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.xl,
    lineHeight: 18,
  },
});
