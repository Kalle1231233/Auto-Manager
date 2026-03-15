import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useTrips } from '../hooks/useTrips';
import { useVehicles } from '../hooks/useVehicles';
import { RootStackParamList } from '../types';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../constants/theme';

type Nav = StackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'AddTrip'>;

export function AddTripScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { vehicleId } = route.params;

  const { addTrip } = useTrips();
  const { getVehicle, updateVehicle } = useVehicles();
  const vehicle = getVehicle(vehicleId);

  const today = formatDate(new Date().toISOString());

  const [date, setDate] = useState(today);
  const [startMileage, setStartMileage] = useState(vehicle ? String(vehicle.mileage) : '');
  const [endMileage, setEndMileage] = useState('');
  const [destination, setDestination] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isBusinessTrip, setIsBusinessTrip] = useState(true);

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  }

  function parseDate(input: string): string | undefined {
    const parts = input.split('.');
    if (parts.length !== 3) return undefined;
    const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString();
  }

  const distance = endMileage && startMileage
    ? Math.max(0, parseInt(endMileage) - parseInt(startMileage))
    : 0;

  const handleSave = async () => {
    const parsedDate = parseDate(date);
    if (!parsedDate) {
      Alert.alert('Ungültiges Datum', 'Bitte TT.MM.JJJJ eingeben.');
      return;
    }
    if (!destination.trim()) {
      Alert.alert('Ziel fehlt', 'Bitte ein Ziel eintragen.');
      return;
    }
    const start = parseInt(startMileage);
    const end = parseInt(endMileage);
    if (isNaN(start) || isNaN(end) || end <= start) {
      Alert.alert('Ungültige km', 'End-km muss größer als Start-km sein.');
      return;
    }

    await addTrip({
      vehicleId,
      date: parsedDate,
      startMileage: start,
      endMileage: end,
      destination: destination.trim(),
      purpose: purpose.trim() || 'Geschäftsfahrt',
      isBusinessTrip,
    });

    if (end > (vehicle?.mileage ?? 0)) {
      await updateVehicle(vehicleId, { mileage: end });
    }

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Fahrt eintragen</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Speichern</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {vehicle && (
            <View style={styles.vehicleInfo}>
              <View style={[styles.vehicleDot, { backgroundColor: vehicle.color }]} />
              <Text style={styles.vehicleInfoText}>{vehicle.name} · {vehicle.brand} {vehicle.model}</Text>
            </View>
          )}

          {/* Typ */}
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, isBusinessTrip && styles.typeBtnActive]}
              onPress={() => setIsBusinessTrip(true)}
            >
              <Ionicons name="business" size={18} color={isBusinessTrip ? '#fff' : Colors.textSecondary} />
              <Text style={[styles.typeBtnText, isBusinessTrip && styles.typeBtnTextActive]}>Geschäftlich</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, !isBusinessTrip && styles.typeBtnPrivate]}
              onPress={() => setIsBusinessTrip(false)}
            >
              <Ionicons name="home" size={18} color={!isBusinessTrip ? '#fff' : Colors.textSecondary} />
              <Text style={[styles.typeBtnText, !isBusinessTrip && styles.typeBtnTextActive]}>Privat</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formCard}>
            <Field label="Datum *" value={date} onChange={setDate} placeholder="TT.MM.JJJJ" keyboard="numbers-and-punctuation" />
            <Field label="Ziel / Adresse *" value={destination} onChange={setDestination} placeholder="z.B. Kundentermin München" />
            <Field label="Zweck / Anlass" value={purpose} onChange={setPurpose} placeholder="z.B. Kundenbesprechung, Lieferung…" />
          </View>

          <View style={styles.formCard}>
            <Field label="Start-km *" value={startMileage} onChange={setStartMileage} placeholder="42000" keyboard="number-pad" suffix="km" />
            <Field label="End-km *" value={endMileage} onChange={setEndMileage} placeholder="42150" keyboard="number-pad" suffix="km" />
            {distance > 0 && (
              <View style={styles.distancePreview}>
                <Ionicons name="navigate" size={16} color={Colors.primary} />
                <Text style={styles.distanceText}>Strecke: <Text style={styles.distanceBold}>{distance} km</Text></Text>
              </View>
            )}
          </View>

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label, value, onChange, placeholder, keyboard, suffix,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboard?: any; suffix?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          keyboardType={keyboard}
        />
        {suffix && <Text style={styles.suffix}>{suffix}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  navBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  navTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text },
  saveBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  saveBtnText: { color: '#fff', fontWeight: FontWeight.semibold, fontSize: FontSize.sm },
  scroll: { padding: Spacing.md },
  vehicleInfo: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md,
    backgroundColor: Colors.surface, padding: Spacing.sm, borderRadius: BorderRadius.md, ...Shadow.small,
  },
  vehicleDot: { width: 24, height: 24, borderRadius: 12 },
  vehicleInfoText: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.text },
  typeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
  },
  typeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeBtnPrivate: { backgroundColor: Colors.success, borderColor: Colors.success },
  typeBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  typeBtnTextActive: { color: '#fff' },
  formCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    ...Shadow.small, marginBottom: Spacing.md,
  },
  field: { paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  fieldLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, marginBottom: 3 },
  fieldRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, fontSize: FontSize.md, color: Colors.text, paddingVertical: 2 },
  suffix: { fontSize: FontSize.sm, color: Colors.textTertiary, marginLeft: 4 },
  distancePreview: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primaryLight, padding: Spacing.sm,
    borderRadius: BorderRadius.sm, marginTop: Spacing.xs,
  },
  distanceText: { fontSize: FontSize.sm, color: Colors.primary },
  distanceBold: { fontWeight: FontWeight.bold },
});
