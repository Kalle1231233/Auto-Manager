import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import { useUserProfile } from '../hooks/useUserProfile';
import { EmployeeRole } from '../types';
import { ROLE_CONFIG, ALL_ROLES } from '../constants/employees';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../constants/theme';

export function EditProfileScreen() {
  const navigation = useNavigation();
  const { profile, updateProfile } = useUserProfile();

  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState<EmployeeRole>(profile.role);
  const [email, setEmail] = useState(profile.email ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [companyName, setCompanyName] = useState(profile.companyName ?? '');
  const [imageBase64, setImageBase64] = useState(profile.imageBase64);

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

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Name fehlt'); return; }
    await updateProfile({
      name: name.trim(),
      role,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      companyName: companyName.trim() || undefined,
      imageBase64,
    });
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
          <Text style={styles.navTitle}>Mein Profil bearbeiten</Text>
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
                  <Text style={[styles.initial, { color: roleConfig.color }]}>
                    {name ? name.charAt(0).toUpperCase() : '?'}
                  </Text>
                </View>
              )}
              <View style={[styles.cameraIcon, { backgroundColor: Colors.primary }]}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
            <View style={[styles.ownerBadge]}>
              <Ionicons name="star" size={12} color={Colors.warning} />
              <Text style={styles.ownerText}>Inhaber / Hauptnutzer</Text>
            </View>
          </View>

          {/* Rolle */}
          <Text style={styles.sectionLabel}>Meine Rolle</Text>
          <View style={styles.card}>
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
                    <Ionicons name={cfg.icon as any} size={15} color={active ? '#fff' : cfg.color} />
                    <Text style={[styles.roleBtnText, { color: active ? '#fff' : cfg.color }]}>{cfg.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Daten */}
          <Text style={styles.sectionLabel}>Persönliche Daten</Text>
          <View style={styles.card}>
            <Field label="Name *" value={name} onChange={setName} placeholder="Max Mustermann" />
            <Field label="Unternehmen / Firma" value={companyName} onChange={setCompanyName} placeholder="Musterfirma GmbH" />
            <Field label="E-Mail" value={email} onChange={setEmail} placeholder="max@firma.de" keyboard="email-address" />
            <Field label="Telefon" value={phone} onChange={setPhone} placeholder="+49 123 456789" keyboard="phone-pad" />
          </View>

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChange, placeholder, keyboard }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; keyboard?: any;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary} keyboardType={keyboard}
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
  avatarSection: { alignItems: 'center', marginBottom: Spacing.lg, gap: Spacing.sm },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, ...Shadow.medium },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', ...Shadow.medium },
  initial: { fontSize: 40, fontWeight: FontWeight.bold },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  ownerBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.warningLight, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full },
  ownerText: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.medium },
  sectionLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, marginBottom: Spacing.xs, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing.sm },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, ...Shadow.small, marginBottom: Spacing.md },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingVertical: Spacing.sm },
  roleBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background },
  roleBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  field: { paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  fieldLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, marginBottom: 3 },
  input: { fontSize: FontSize.md, color: Colors.text, paddingVertical: 2 },
});
