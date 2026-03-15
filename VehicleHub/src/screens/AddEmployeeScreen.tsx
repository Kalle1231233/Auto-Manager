import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';

import { useEmployees } from '../hooks/useEmployees';
import { useVehicles } from '../hooks/useVehicles';
import { EmployeeRole, RootStackParamList } from '../types';
import { ROLE_CONFIG, ALL_ROLES } from '../constants/employees';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../constants/theme';

type Nav = StackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'AddEmployee'>;

export function AddEmployeeScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { employeeId } = route.params ?? {};

  const { addEmployee, updateEmployee, getEmployee } = useEmployees();
  const { vehicles } = useVehicles();
  const existing = employeeId ? getEmployee(employeeId) : undefined;
  const isEditing = !!existing;

  const [name, setName] = useState('');
  const [role, setRole] = useState<EmployeeRole>('fahrer');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [notes, setNotes] = useState('');
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setRole(existing.role);
      setEmail(existing.email ?? '');
      setPhone(existing.phone ?? '');
      setLicenseNumber(existing.licenseNumber ?? '');
      setLicenseExpiry(existing.licenseExpiry ? fmtDate(existing.licenseExpiry) : '');
      setNotes(existing.notes ?? '');
      setImageBase64(existing.imageBase64);
      setSelectedVehicleIds(existing.assignedVehicleIds);
      setIsActive(existing.isActive);
    }
  }, [existing]);

  function fmtDate(iso: string): string {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  }

  function parseDate(input: string): string | undefined {
    const p = input.split('.');
    if (p.length !== 3) return undefined;
    const d = new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }

  const pickImage = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Berechtigung benötigt'); return; }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.6, base64: true,
    });
    if (!result.canceled && result.assets[0].base64) setImageBase64(result.assets[0].base64);
  };

  const toggleVehicle = (id: string) => {
    setSelectedVehicleIds(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Name fehlt'); return; }
    const data = {
      name: name.trim(),
      role,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      licenseNumber: licenseNumber.trim() || undefined,
      licenseExpiry: licenseExpiry ? parseDate(licenseExpiry) : undefined,
      notes: notes.trim() || undefined,
      imageBase64,
      assignedVehicleIds: selectedVehicleIds,
      isActive,
    };
    if (isEditing && employeeId) {
      await updateEmployee(employeeId, data);
    } else {
      await addEmployee(data);
    }
    navigation.goBack();
  };

  const roleConfig = ROLE_CONFIG[role];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>{isEditing ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter'}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Speichern</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage} activeOpacity={0.8}>
              {imageBase64 ? (
                <Image source={{ uri: `data:image/jpeg;base64,${imageBase64}` }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: roleConfig.color + '20' }]}>
                  <Text style={[styles.avatarInitial, { color: roleConfig.color }]}>
                    {name ? name.charAt(0).toUpperCase() : '?'}
                  </Text>
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Foto hinzufügen</Text>
          </View>

          {/* Rolle */}
          <FormSection title="Rolle">
            <View style={styles.roleGrid}>
              {ALL_ROLES.map(r => {
                const cfg = ROLE_CONFIG[r];
                const active = role === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleBtn, active && { backgroundColor: cfg.color, borderColor: cfg.color }]}
                    onPress={() => setRole(r)}
                  >
                    <Ionicons name={cfg.icon as any} size={16} color={active ? '#fff' : cfg.color} />
                    <Text style={[styles.roleBtnText, { color: active ? '#fff' : cfg.color }]}>{cfg.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </FormSection>

          {/* Kontaktdaten */}
          <FormSection title="Kontaktdaten">
            <Field label="Name *" value={name} onChange={setName} placeholder="Max Mustermann" />
            <Field label="E-Mail" value={email} onChange={setEmail} placeholder="max@firma.de" keyboard="email-address" />
            <Field label="Telefon" value={phone} onChange={setPhone} placeholder="+49 123 456789" keyboard="phone-pad" />
          </FormSection>

          {/* Führerschein */}
          <FormSection title="Führerschein">
            <Field label="Führerschein-Nummer" value={licenseNumber} onChange={setLicenseNumber} placeholder="B123456" autoCapitalize="characters" />
            <Field label="Gültig bis" value={licenseExpiry} onChange={setLicenseExpiry} placeholder="TT.MM.JJJJ" keyboard="numbers-and-punctuation" />
          </FormSection>

          {/* Fahrzeuge zuweisen */}
          {vehicles.length > 0 && (
            <FormSection title="Zugewiesene Fahrzeuge">
              <View style={styles.vehicleList}>
                {vehicles.map(v => {
                  const assigned = selectedVehicleIds.includes(v.id);
                  return (
                    <TouchableOpacity
                      key={v.id}
                      style={[styles.vehicleItem, assigned && styles.vehicleItemActive]}
                      onPress={() => toggleVehicle(v.id)}
                    >
                      <View style={[styles.vehicleDot, { backgroundColor: v.color }]} />
                      <View style={styles.vehicleItemInfo}>
                        <Text style={[styles.vehicleItemName, assigned && { color: Colors.primary }]}>{v.name}</Text>
                        <Text style={styles.vehicleItemSub}>{v.brand} {v.model}</Text>
                      </View>
                      <View style={[styles.checkbox, assigned && styles.checkboxActive]}>
                        {assigned && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </FormSection>
          )}

          {/* Notizen & Status */}
          <FormSection title="Sonstiges">
            <Field label="Notizen" value={notes} onChange={setNotes} placeholder="Interne Anmerkungen…" multiline />
            <TouchableOpacity style={styles.toggleRow} onPress={() => setIsActive(!isActive)}>
              <View style={[styles.checkbox, isActive && styles.checkboxActive]}>
                {isActive && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={styles.toggleText}>Mitarbeiter aktiv</Text>
            </TouchableOpacity>
          </FormSection>

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Field({ label, value, onChange, placeholder, keyboard, autoCapitalize, multiline }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboard?: any; autoCapitalize?: any; multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        keyboardType={keyboard}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
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
  avatarSection: { alignItems: 'center', marginBottom: Spacing.md },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 36, fontWeight: FontWeight.bold },
  cameraIcon: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: Colors.primary, borderRadius: 14, width: 28, height: 28,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff',
  },
  avatarHint: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: Spacing.xs },
  section: { marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, marginBottom: Spacing.xs, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, ...Shadow.small },
  field: { paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  fieldLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, marginBottom: 3 },
  input: { fontSize: FontSize.md, color: Colors.text, paddingVertical: 2 },
  inputMulti: { height: 72, textAlignVertical: 'top' },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingVertical: Spacing.sm },
  roleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.sm, paddingVertical: 6,
    borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  roleBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  vehicleList: { paddingVertical: Spacing.xs },
  vehicleItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  vehicleItemActive: { backgroundColor: Colors.primaryLight, marginHorizontal: -Spacing.md, paddingHorizontal: Spacing.md },
  vehicleDot: { width: 12, height: 12, borderRadius: 6 },
  vehicleItemInfo: { flex: 1 },
  vehicleItemName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  vehicleItemSub: { fontSize: FontSize.xs, color: Colors.textTertiary },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  toggleText: { fontSize: FontSize.sm, color: Colors.text },
});
