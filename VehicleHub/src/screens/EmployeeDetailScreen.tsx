import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useEmployees } from '../hooks/useEmployees';
import { useVehicles } from '../hooks/useVehicles';
import { useEntries } from '../hooks/useEntries';
import { useTrips } from '../hooks/useTrips';
import { ROLE_CONFIG } from '../constants/employees';
import { CATEGORY_CONFIG } from '../constants/categories';
import { formatDate, formatMileage, formatCurrency, getDaysUntil } from '../utils/calculations';
import { getTotalCost } from '../utils/stats';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../constants/theme';
import { RootStackParamList } from '../types';

type Nav = StackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'EmployeeDetail'>;

export function EmployeeDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { employeeId } = route.params;

  const { getEmployee, deleteEmployee, updateEmployee } = useEmployees();
  const { vehicles } = useVehicles();
  const { entries } = useEntries();
  const { trips } = useTrips();

  const employee = getEmployee(employeeId);

  const assignedVehicles = useMemo(
    () => vehicles.filter(v => employee?.assignedVehicleIds.includes(v.id)),
    [vehicles, employee]
  );
  const employeeTrips = useMemo(
    () => trips.filter(t => t.driverEmployeeId === employeeId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [trips, employeeId]
  );
  const employeeEntries = useMemo(
    () => entries.filter(e => e.doneByEmployeeId === employeeId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [entries, employeeId]
  );

  const totalTripKm = employeeTrips.reduce((s, t) => s + t.distance, 0);
  const businessTripKm = employeeTrips.filter(t => t.isBusinessTrip).reduce((s, t) => s + t.distance, 0);
  const totalCost = getTotalCost(employeeEntries);

  if (!employee) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ padding: 20 }}>Mitarbeiter nicht gefunden.</Text>
      </SafeAreaView>
    );
  }

  const roleConfig = ROLE_CONFIG[employee.role];
  const licenseExpiry = getDaysUntil(employee.licenseExpiry);
  const licenseWarning = licenseExpiry != null && licenseExpiry < 60;

  const handleDelete = () => {
    Alert.alert('Mitarbeiter löschen', `"${employee.name}" wirklich löschen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: async () => { await deleteEmployee(employeeId); navigation.goBack(); } },
    ]);
  };

  const toggleActive = async () => {
    await updateEmployee(employeeId, { isActive: !employee.isActive });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: roleConfig.color }]}>
          <View style={styles.heroNav}>
            <TouchableOpacity style={styles.heroBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroBtn} onPress={() => navigation.navigate('AddEmployee', { employeeId })}>
              <Ionicons name="create-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroBody}>
            {employee.imageBase64 ? (
              <Image source={{ uri: `data:image/jpeg;base64,${employee.imageBase64}` }} style={styles.heroAvatar} />
            ) : (
              <View style={styles.heroAvatarPlaceholder}>
                <Text style={styles.heroInitial}>{employee.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{employee.name}</Text>
              <View style={styles.heroBadgeRow}>
                <View style={styles.heroBadge}>
                  <Ionicons name={roleConfig.icon as any} size={12} color="#fff" />
                  <Text style={styles.heroBadgeText}>{roleConfig.label}</Text>
                </View>
                {!employee.isActive && (
                  <View style={[styles.heroBadge, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                    <Text style={styles.heroBadgeText}>Inaktiv</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Führerschein-Warnung */}
          {licenseWarning && (
            <View style={[styles.warnBox, { backgroundColor: licenseExpiry! < 0 ? '#FFCDD2' : '#FFF3E0', borderLeftColor: licenseExpiry! < 0 ? Colors.danger : Colors.warning }]}>
              <Ionicons name="warning" size={18} color={licenseExpiry! < 0 ? Colors.danger : Colors.warning} />
              <Text style={[styles.warnText, { color: licenseExpiry! < 0 ? Colors.danger : Colors.warning }]}>
                {licenseExpiry! < 0 ? `Führerschein seit ${Math.abs(licenseExpiry!)} Tagen abgelaufen!` : `Führerschein läuft in ${licenseExpiry} Tagen ab`}
              </Text>
            </View>
          )}

          {/* KPI */}
          <View style={styles.kpiRow}>
            <KPI icon="navigate" label="Gesamt-km" value={`${totalTripKm} km`} color={Colors.primary} />
            <KPI icon="business" label="Biz-km" value={`${businessTripKm} km`} color={Colors.success} />
            <KPI icon="cash" label="Kosten" value={formatCurrency(totalCost)} color="#FF6D00" />
          </View>

          {/* Kontaktdaten */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Kontakt & Infos</Text>
            {employee.email && <InfoRow icon="mail-outline" label="E-Mail" value={employee.email} />}
            {employee.phone && <InfoRow icon="call-outline" label="Telefon" value={employee.phone} />}
            {employee.licenseNumber && <InfoRow icon="card-outline" label="Führerschein" value={employee.licenseNumber} />}
            {employee.licenseExpiry && (
              <InfoRow
                icon="calendar-outline"
                label="Führerschein gültig bis"
                value={formatDate(employee.licenseExpiry)}
                color={licenseWarning ? Colors.danger : undefined}
              />
            )}
            {employee.notes && <InfoRow icon="document-text-outline" label="Notizen" value={employee.notes} />}
          </View>

          {/* Zugewiesene Fahrzeuge */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Zugewiesene Fahrzeuge ({assignedVehicles.length})</Text>
            {assignedVehicles.length === 0 ? (
              <Text style={styles.noData}>Keine Fahrzeuge zugewiesen.</Text>
            ) : (
              assignedVehicles.map(v => (
                <View key={v.id} style={styles.vehicleRow}>
                  <View style={[styles.vehicleDot, { backgroundColor: v.color }]} />
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleName}>{v.name}</Text>
                    <Text style={styles.vehicleSub}>{v.brand} {v.model} · {formatMileage(v.mileage)}</Text>
                  </View>
                  <Text style={styles.vehiclePlate}>{v.licensePlate}</Text>
                </View>
              ))
            )}
          </View>

          {/* Fahrten */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Fahrten ({employeeTrips.length})</Text>
            {employeeTrips.length === 0 ? (
              <Text style={styles.noData}>Noch keine Fahrten zugeordnet.</Text>
            ) : (
              employeeTrips.slice(0, 10).map(t => (
                <View key={t.id} style={styles.tripRow}>
                  <View style={[styles.tripDot, { backgroundColor: t.isBusinessTrip ? Colors.primary : Colors.border }]} />
                  <View style={styles.tripInfo}>
                    <Text style={styles.tripDest}>{t.destination}</Text>
                    <Text style={styles.tripMeta}>{formatDate(t.date)} · {t.distance} km · {t.purpose}</Text>
                  </View>
                  <Text style={[styles.tripType, { color: t.isBusinessTrip ? Colors.primary : Colors.textTertiary }]}>
                    {t.isBusinessTrip ? 'Biz' : 'Priv'}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* Letzte Einträge */}
          {employeeEntries.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Erledigte Arbeiten ({employeeEntries.length})</Text>
              {employeeEntries.slice(0, 5).map(e => {
                const cfg = CATEGORY_CONFIG[e.category];
                return (
                  <View key={e.id} style={styles.entryRow}>
                    <View style={[styles.entryIcon, { backgroundColor: cfg.bgColor }]}>
                      <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
                    </View>
                    <View style={styles.entryInfo}>
                      <Text style={styles.entryLabel}>{cfg.label}</Text>
                      <Text style={styles.entryMeta}>{formatDate(e.date)}{e.cost != null ? ` · ${formatCurrency(e.cost)}` : ''}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Aktionen */}
          <TouchableOpacity style={styles.toggleBtn} onPress={toggleActive}>
            <Ionicons name={employee.isActive ? 'pause-circle-outline' : 'play-circle-outline'} size={18} color={Colors.primary} />
            <Text style={styles.toggleBtnText}>{employee.isActive ? 'Als inaktiv markieren' : 'Wieder aktivieren'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={Colors.danger} />
            <Text style={styles.deleteBtnText}>Mitarbeiter löschen</Text>
          </TouchableOpacity>

          <View style={{ height: Spacing.xxl }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function KPI({ icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <View style={[styles.kpi, Shadow.small]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value, color }: { icon: any; label: string; value: string; color?: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={color ?? Colors.textSecondary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, color && { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  hero: { paddingHorizontal: Spacing.md, paddingTop: 50, paddingBottom: Spacing.xl },
  heroNav: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  heroBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  heroBody: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  heroAvatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
  heroAvatarPlaceholder: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  heroInitial: { fontSize: 28, fontWeight: FontWeight.bold, color: '#fff' },
  heroInfo: { flex: 1 },
  heroName: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: '#fff' },
  heroBadgeRow: { flexDirection: 'row', gap: Spacing.xs, marginTop: 4, flexWrap: 'wrap' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  heroBadgeText: { fontSize: FontSize.xs, color: '#fff', fontWeight: FontWeight.medium },
  content: { padding: Spacing.md },
  warnBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, borderRadius: BorderRadius.md, borderLeftWidth: 3, marginBottom: Spacing.sm },
  warnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, flex: 1 },
  kpiRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  kpi: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: 'center', gap: 3 },
  kpiValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  kpiLabel: { fontSize: 9, color: Colors.textTertiary, textAlign: 'center' },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.small },
  cardTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  infoLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  infoValue: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.text },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  vehicleDot: { width: 12, height: 12, borderRadius: 6 },
  vehicleInfo: { flex: 1 },
  vehicleName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  vehicleSub: { fontSize: FontSize.xs, color: Colors.textTertiary },
  vehiclePlate: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  tripRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  tripDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  tripInfo: { flex: 1 },
  tripDest: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  tripMeta: { fontSize: FontSize.xs, color: Colors.textTertiary },
  tripType: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  entryIcon: { width: 30, height: 30, borderRadius: BorderRadius.sm, justifyContent: 'center', alignItems: 'center' },
  entryInfo: { flex: 1 },
  entryLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.text },
  entryMeta: { fontSize: FontSize.xs, color: Colors.textTertiary },
  noData: { fontSize: FontSize.sm, color: Colors.textTertiary, paddingVertical: Spacing.sm },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.primary, marginBottom: Spacing.sm },
  toggleBtnText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.danger },
  deleteBtnText: { color: Colors.danger, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
