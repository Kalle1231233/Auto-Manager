import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useUserProfile } from '../hooks/useUserProfile';
import { useEmployees } from '../hooks/useEmployees';
import { useVehicles } from '../hooks/useVehicles';
import { useTrips } from '../hooks/useTrips';
import { useDocuments } from '../hooks/useDocuments';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { ReminderBox } from '../components/ReminderBox';
import { ROLE_CONFIG } from '../constants/employees';
import { DOCUMENT_CONFIG } from '../constants/employees';
import { formatDate, getDaysUntil } from '../utils/calculations';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../constants/theme';
import { RootStackParamList, Employee } from '../types';

type Nav = StackNavigationProp<RootStackParamList>;

export function TeamScreen() {
  const navigation = useNavigation<Nav>();
  const { profile } = useUserProfile();
  const { employees } = useEmployees();
  const { vehicles } = useVehicles();
  const { trips } = useTrips();
  const { getExpiringDocuments } = useDocuments();

  const activeEmployees = employees.filter(e => e.isActive);
  const inactiveEmployees = employees.filter(e => !e.isActive);

  const expiringDocs = useMemo(() => getExpiringDocuments(60), [getExpiringDocuments]);

  const roleConfig = ROLE_CONFIG[profile.role];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Team & Profile</Text>
        <Text style={styles.subtitle}>{activeEmployees.length} Mitarbeiter aktiv</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Eigenes Profil */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => navigation.navigate('EditProfile')}
          activeOpacity={0.85}
        >
          <View style={styles.profileLeft}>
            {profile.imageBase64 ? (
              <Image source={{ uri: `data:image/jpeg;base64,${profile.imageBase64}` }} style={styles.profileAvatar} />
            ) : (
              <View style={[styles.profileAvatarPlaceholder, { backgroundColor: roleConfig.color + '30' }]}>
                <Ionicons name={roleConfig.icon as any} size={28} color={roleConfig.color} />
              </View>
            )}
            <View>
              <View style={styles.profileNameRow}>
                <Text style={styles.profileName}>{profile.name}</Text>
                <View style={[styles.ownerBadge]}>
                  <Ionicons name="star" size={10} color="#fff" />
                  <Text style={styles.ownerBadgeText}>Inhaber</Text>
                </View>
              </View>
              <Text style={styles.profileRole}>{roleConfig.label}</Text>
              {profile.companyName ? <Text style={styles.profileCompany}>{profile.companyName}</Text> : null}
              {profile.email ? <Text style={styles.profileContact}>{profile.email}</Text> : null}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
        </TouchableOpacity>

        {/* Ablaufende Dokumente */}
        {expiringDocs.length > 0 && (
          <>
            <SectionTitle title="Dokumente ablaufend" />
            {expiringDocs.slice(0, 3).map(doc => {
              const days = getDaysUntil(doc.expiryDate);
              const vehicle = vehicles.find(v => v.id === doc.vehicleId);
              const level = days == null ? 'ok' : days < 0 ? 'overdue' : days < 14 ? 'danger' : 'warning';
              return (
                <ReminderBox
                  key={doc.id}
                  level={level}
                  title={`${doc.title}${vehicle ? ` – ${vehicle.name}` : ''}`}
                  subtitle={days != null && days < 0
                    ? `Seit ${Math.abs(days)} Tagen abgelaufen`
                    : `Läuft ab: ${formatDate(doc.expiryDate)}`}
                  icon="document-text"
                />
              );
            })}
          </>
        )}

        {/* Stats-Zeile */}
        <View style={styles.statsRow}>
          <StatBox icon="people" label="Mitarbeiter" value={String(activeEmployees.length)} color={Colors.primary} />
          <StatBox icon="car" label="Fahrzeuge" value={String(vehicles.length)} color={Colors.success} />
          <StatBox icon="navigate" label="Fahrten" value={String(trips.length)} color="#FF6D00" />
          <StatBox icon="document-text" label="Dokumente" value={String(expiringDocs.length)} color={expiringDocs.length > 0 ? Colors.danger : Colors.textTertiary} />
        </View>

        {/* Aktive Mitarbeiter */}
        <SectionTitle
          title={`Mitarbeiter (${activeEmployees.length})`}
          action="+ Hinzufügen"
          onAction={() => navigation.navigate('AddEmployee', {})}
        />

        {activeEmployees.length === 0 ? (
          <EmptyTeam onAdd={() => navigation.navigate('AddEmployee', {})} />
        ) : (
          activeEmployees.map(emp => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              vehicles={vehicles.filter(v => emp.assignedVehicleIds.includes(v.id))}
              tripCount={trips.filter(t => t.driverEmployeeId === emp.id).length}
              onPress={() => navigation.navigate('EmployeeDetail', { employeeId: emp.id })}
            />
          ))
        )}

        {/* Inaktive */}
        {inactiveEmployees.length > 0 && (
          <>
            <SectionTitle title={`Inaktiv (${inactiveEmployees.length})`} />
            {inactiveEmployees.map(emp => (
              <EmployeeCard
                key={emp.id}
                employee={emp}
                vehicles={[]}
                tripCount={0}
                onPress={() => navigation.navigate('EmployeeDetail', { employeeId: emp.id })}
                inactive
              />
            ))}
          </>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      <FloatingActionButton
        onPress={() => navigation.navigate('AddEmployee', {})}
        icon="person-add"
      />
    </SafeAreaView>
  );
}

function EmployeeCard({
  employee, vehicles, tripCount, onPress, inactive,
}: {
  employee: Employee;
  vehicles: any[];
  tripCount: number;
  onPress: () => void;
  inactive?: boolean;
}) {
  const roleConfig = ROLE_CONFIG[employee.role];
  const licenseExpiry = getDaysUntil(employee.licenseExpiry);
  const licenseWarning = licenseExpiry != null && licenseExpiry < 60;

  return (
    <TouchableOpacity
      style={[styles.empCard, inactive && styles.empCardInactive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.empLeft}>
        {employee.imageBase64 ? (
          <Image
            source={{ uri: `data:image/jpeg;base64,${employee.imageBase64}` }}
            style={[styles.empAvatar, inactive && { opacity: 0.5 }]}
          />
        ) : (
          <View style={[styles.empAvatarPlaceholder, { backgroundColor: roleConfig.color + '20' }]}>
            <Text style={[styles.empInitial, { color: roleConfig.color }]}>
              {employee.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.empInfo}>
          <View style={styles.empNameRow}>
            <Text style={[styles.empName, inactive && { color: Colors.textTertiary }]}>
              {employee.name}
            </Text>
            {inactive && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>Inaktiv</Text>
              </View>
            )}
          </View>
          <View style={[styles.roleBadge, { backgroundColor: roleConfig.color + '15' }]}>
            <Ionicons name={roleConfig.icon as any} size={11} color={roleConfig.color} />
            <Text style={[styles.roleText, { color: roleConfig.color }]}>{roleConfig.label}</Text>
          </View>
          <View style={styles.empMeta}>
            {vehicles.length > 0 && (
              <MetaChip icon="car-outline" label={vehicles.map(v => v.name).join(', ')} />
            )}
            {tripCount > 0 && (
              <MetaChip icon="navigate-outline" label={`${tripCount} Fahrten`} />
            )}
            {licenseWarning && (
              <MetaChip icon="warning" label={`FS: ${formatDate(employee.licenseExpiry)}`} color={Colors.warning} />
            )}
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
}

function MetaChip({ icon, label, color }: { icon: any; label: string; color?: string }) {
  return (
    <View style={styles.metaChip}>
      <Ionicons name={icon} size={10} color={color ?? Colors.textTertiary} />
      <Text style={[styles.metaChipText, color && { color }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function StatBox({ icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <View style={[styles.statBox, Shadow.small]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function EmptyTeam({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.empty}>
      <Ionicons name="people-outline" size={64} color={Colors.border} />
      <Text style={styles.emptyTitle}>Noch keine Mitarbeiter</Text>
      <Text style={styles.emptyText}>Füge dein Team hinzu, um Fahrzeuge zuzuweisen und Fahrten zu verfolgen.</Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={onAdd}>
        <Text style={styles.emptyBtnText}>Mitarbeiter hinzufügen</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },
  scroll: { padding: Spacing.md, paddingTop: Spacing.xs },

  // Profil
  profileCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, borderRadius: BorderRadius.xl,
    padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.medium,
  },
  profileLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  profileAvatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  profileAvatarPlaceholder: {
    width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  profileNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  profileName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#fff' },
  ownerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 6,
    paddingVertical: 2, borderRadius: BorderRadius.full,
  },
  ownerBadgeText: { fontSize: FontSize.xs, color: '#fff', fontWeight: FontWeight.semibold },
  profileRole: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  profileCompany: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)' },
  profileContact: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)' },

  // Stats
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  statBox: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.sm, alignItems: 'center', gap: 3,
  },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  statLabel: { fontSize: 9, color: Colors.textTertiary, textAlign: 'center' },

  // Section
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.sm, marginTop: Spacing.sm,
  },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  sectionAction: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },

  // Employee Card
  empCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.small,
  },
  empCardInactive: { opacity: 0.7 },
  empLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  empAvatar: { width: 50, height: 50, borderRadius: 25 },
  empAvatarPlaceholder: {
    width: 50, height: 50, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center',
  },
  empInitial: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  empInfo: { flex: 1 },
  empNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  empName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  inactiveBadge: {
    backgroundColor: Colors.borderLight, paddingHorizontal: 6, paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  inactiveBadgeText: { fontSize: FontSize.xs, color: Colors.textTertiary },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.full,
    alignSelf: 'flex-start', marginTop: 3,
  },
  roleText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  empMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.background, paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  metaChipText: { fontSize: 10, color: Colors.textTertiary },

  // Empty
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.xl, lineHeight: 20 },
  emptyBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, marginTop: Spacing.sm },
  emptyBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
