import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useDocuments } from '../hooks/useDocuments';
import { useVehicles } from '../hooks/useVehicles';
import { DocumentType, RootStackParamList } from '../types';
import { DOCUMENT_CONFIG, ALL_DOCUMENT_TYPES } from '../constants/employees';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../constants/theme';

type Nav = StackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'AddDocument'>;

export function AddDocumentScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { vehicleId, documentId } = route.params;

  const { addDocument, updateDocument, documents } = useDocuments();
  const { getVehicle } = useVehicles();
  const vehicle = getVehicle(vehicleId);
  const existing = documentId ? documents.find(d => d.id === documentId) : undefined;

  const [type, setType] = useState<DocumentType>('versicherung');
  const [title, setTitle] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [provider, setProvider] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (existing) {
      setType(existing.type);
      setTitle(existing.title);
      setIssueDate(existing.issueDate ? fmt(existing.issueDate) : '');
      setExpiryDate(existing.expiryDate ? fmt(existing.expiryDate) : '');
      setProvider(existing.provider ?? '');
      setPolicyNumber(existing.policyNumber ?? '');
      setNotes(existing.notes ?? '');
    } else {
      setTitle(DOCUMENT_CONFIG[type].label);
    }
  }, [existing]);

  useEffect(() => {
    if (!existing) setTitle(DOCUMENT_CONFIG[type].label);
  }, [type]);

  function fmt(iso: string): string {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  }

  function parse(input: string): string | undefined {
    const p = input.split('.');
    if (p.length !== 3) return undefined;
    const d = new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Titel fehlt'); return; }
    const data = {
      vehicleId,
      type,
      title: title.trim(),
      issueDate: issueDate ? parse(issueDate) : undefined,
      expiryDate: expiryDate ? parse(expiryDate) : undefined,
      provider: provider.trim() || undefined,
      policyNumber: policyNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    };
    if (existing && documentId) {
      await updateDocument(documentId, data);
    } else {
      await addDocument(data);
    }
    navigation.goBack();
  };

  const cfg = DOCUMENT_CONFIG[type];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>{existing ? 'Dokument bearbeiten' : 'Neues Dokument'}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Speichern</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {vehicle && (
            <View style={styles.vehicleInfo}>
              <View style={[styles.vehicleDot, { backgroundColor: vehicle.color }]} />
              <Text style={styles.vehicleText}>{vehicle.name} · {vehicle.brand} {vehicle.model}</Text>
            </View>
          )}

          {/* Dokument-Typ */}
          <Text style={styles.sectionLabel}>Dokumenttyp</Text>
          <View style={styles.typeGrid}>
            {ALL_DOCUMENT_TYPES.map(dt => {
              const c = DOCUMENT_CONFIG[dt];
              const active = type === dt;
              return (
                <TouchableOpacity
                  key={dt}
                  style={[styles.typeBtn, { borderColor: active ? c.color : Colors.border }, active && { backgroundColor: c.bgColor }]}
                  onPress={() => setType(dt)}
                >
                  <Ionicons name={c.icon as any} size={16} color={active ? c.color : Colors.textTertiary} />
                  <Text style={[styles.typeBtnText, { color: active ? c.color : Colors.textSecondary }]}>{c.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Ausgewählter Typ */}
          <View style={[styles.selectedType, { backgroundColor: cfg.bgColor }]}>
            <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
            <Text style={[styles.selectedTypeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>

          {/* Felder */}
          <View style={styles.card}>
            <Field label="Bezeichnung / Titel *" value={title} onChange={setTitle} placeholder={cfg.label} />
            <Field label="Aussteller / Anbieter" value={provider} onChange={setProvider} placeholder="z.B. DEVK, Allianz, KFZ-Amt…" />
            <Field label="Policen-Nr. / Aktenzeichen" value={policyNumber} onChange={setPolicyNumber} placeholder="z.B. POL-2024-XXXXX" />
            <Field label="Ausstellungsdatum" value={issueDate} onChange={setIssueDate} placeholder="TT.MM.JJJJ" keyboard="numbers-and-punctuation" />
            <Field label="Ablaufdatum / Gültig bis" value={expiryDate} onChange={setExpiryDate} placeholder="TT.MM.JJJJ" keyboard="numbers-and-punctuation" />
            <Field label="Notizen" value={notes} onChange={setNotes} placeholder="Weitere Infos…" multiline />
          </View>

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChange, placeholder, keyboard, multiline }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboard?: any; multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary} keyboardType={keyboard}
        multiline={multiline} numberOfLines={multiline ? 3 : 1}
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
  vehicleInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md, backgroundColor: Colors.surface, padding: Spacing.sm, borderRadius: BorderRadius.md, ...Shadow.small },
  vehicleDot: { width: 24, height: 24, borderRadius: 12 },
  vehicleText: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.text },
  sectionLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, marginBottom: Spacing.sm, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  typeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1.5, backgroundColor: Colors.surface },
  typeBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  selectedType: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, borderRadius: BorderRadius.md, marginBottom: Spacing.sm },
  selectedTypeText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, ...Shadow.small, marginBottom: Spacing.md },
  field: { paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  fieldLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, marginBottom: 3 },
  input: { fontSize: FontSize.md, color: Colors.text, paddingVertical: 2 },
  inputMulti: { height: 72, textAlignVertical: 'top' },
});
