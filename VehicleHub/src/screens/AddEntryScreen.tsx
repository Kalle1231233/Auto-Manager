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

import { useEntries } from '../hooks/useEntries';
import { useVehicles } from '../hooks/useVehicles';
import { useBusinessSettings } from '../hooks/useBusinessSettings';
import { EntryCategory, RootStackParamList, VatRate } from '../types';
import { CATEGORY_CONFIG, ALL_CATEGORIES } from '../constants/categories';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../constants/theme';
import { calcVat, calcBusinessAmount } from '../utils/business';

type Nav = StackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'AddEntry'>;

export function AddEntryScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { vehicleId, category: presetCategory } = route.params;

  const { addEntry } = useEntries();
  const { getVehicle, updateVehicle } = useVehicles();
  const { settings: bizSettings } = useBusinessSettings();
  const vehicle = getVehicle(vehicleId);

  const [category, setCategory] = useState<EntryCategory>(presetCategory ?? 'sonstiges');
  const [date, setDate] = useState(formatDateForInput(new Date().toISOString()));
  const [mileage, setMileage] = useState(vehicle ? String(vehicle.mileage) : '');
  const [cost, setCost] = useState('');
  const [note, setNote] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [nextDueMileage, setNextDueMileage] = useState('');
  const [updateMileage, setUpdateMileage] = useState(true);
  // Business-Felder
  const [isBusinessExpense, setIsBusinessExpense] = useState(bizSettings.enabled);
  const [vatRate, setVatRate] = useState<VatRate>(bizSettings.defaultVatRate);
  const [businessRatio, setBusinessRatio] = useState(String(bizSettings.defaultBusinessRatio));
  const [receiptNumber, setReceiptNumber] = useState('');
  const [supplier, setSupplier] = useState('');

  function formatDateForInput(isoDate: string): string {
    const d = new Date(isoDate);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  }

  function parseInputDate(input: string): string | undefined {
    const parts = input.split('.');
    if (parts.length !== 3) return undefined;
    const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString();
  }

  const handleSave = async () => {
    const parsedDate = parseInputDate(date);
    if (!parsedDate) {
      Alert.alert('Ungültiges Datum', 'Bitte gib ein gültiges Datum ein (TT.MM.JJJJ).');
      return;
    }

    const parsedMileage = mileage ? parseInt(mileage) : undefined;
    const parsedCost = cost ? parseFloat(cost.replace(',', '.')) : undefined;
    const parsedNextDue = nextDueDate ? parseInputDate(nextDueDate) : undefined;
    const parsedNextDueMileage = nextDueMileage ? parseInt(nextDueMileage) : undefined;

    const parsedBusinessRatio = parseInt(businessRatio) || 100;

    await addEntry({
      vehicleId,
      category,
      date: parsedDate,
      mileage: parsedMileage,
      cost: parsedCost,
      note: note.trim() || undefined,
      nextDueDate: parsedNextDue,
      nextDueMileage: parsedNextDueMileage,
      isBusinessExpense: isBusinessExpense || undefined,
      vatRate: isBusinessExpense ? vatRate : undefined,
      businessRatio: isBusinessExpense ? parsedBusinessRatio : undefined,
      receiptNumber: receiptNumber.trim() || undefined,
      supplier: supplier.trim() || undefined,
    });

    // Update vehicle mileage if needed
    if (updateMileage && parsedMileage && vehicle && parsedMileage > vehicle.mileage) {
      await updateVehicle(vehicleId, { mileage: parsedMileage });
    }

    // Update vehicle TÜV date if it's a TÜV entry
    if (category === 'tuev' && parsedNextDue && vehicle) {
      await updateVehicle(vehicleId, { tuevDate: parsedNextDue });
    }

    navigation.goBack();
  };

  const config = CATEGORY_CONFIG[category];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Eintrag hinzufügen</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Speichern</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {vehicle && (
            <View style={styles.vehicleInfo}>
              <View style={[styles.vehicleDot, { backgroundColor: vehicle.color }]} />
              <Text style={styles.vehicleInfoText}>
                {vehicle.name} · {vehicle.brand} {vehicle.model}
              </Text>
            </View>
          )}

          {/* Kategorie */}
          <Text style={styles.sectionTitle}>Kategorie</Text>
          <View style={styles.categoryGrid}>
            {ALL_CATEGORIES.map(cat => {
              const cfg = CATEGORY_CONFIG[cat];
              const isActive = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryBtn,
                    { borderColor: isActive ? cfg.color : Colors.border },
                    isActive && { backgroundColor: cfg.bgColor },
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Ionicons name={cfg.icon as any} size={18} color={isActive ? cfg.color : Colors.textTertiary} />
                  <Text style={[styles.categoryBtnText, { color: isActive ? cfg.color : Colors.textSecondary }]}>
                    {cfg.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected category indicator */}
          <View style={[styles.selectedCategory, { backgroundColor: config.bgColor }]}>
            <Ionicons name={config.icon as any} size={20} color={config.color} />
            <Text style={[styles.selectedCategoryText, { color: config.color }]}>
              {config.label} wird eingetragen
            </Text>
          </View>

          {/* Eintragsdaten */}
          <View style={styles.formCard}>
            <FormField
              label="Datum *"
              value={date}
              onChangeText={setDate}
              placeholder="TT.MM.JJJJ"
              keyboardType="numbers-and-punctuation"
            />
            <FormField
              label="Kilometerstand"
              value={mileage}
              onChangeText={setMileage}
              placeholder="42000"
              keyboardType="number-pad"
              suffix="km"
            />
            <FormField
              label="Kosten (optional)"
              value={cost}
              onChangeText={setCost}
              placeholder="0,00"
              keyboardType="decimal-pad"
              suffix="€"
            />
            <FormField
              label="Notiz (optional)"
              value={note}
              onChangeText={setNote}
              placeholder="z.B. Mobil 1 5W-30 vollsynthetisch…"
              multiline
            />
          </View>

          {/* Fälligkeit */}
          <Text style={styles.sectionTitle}>Nächste Fälligkeit</Text>
          <View style={styles.formCard}>
            <FormField
              label="Nächstes Datum (optional)"
              value={nextDueDate}
              onChangeText={setNextDueDate}
              placeholder="TT.MM.JJJJ"
              keyboardType="numbers-and-punctuation"
            />
            <FormField
              label="Nächster km-Stand (optional)"
              value={nextDueMileage}
              onChangeText={setNextDueMileage}
              placeholder="52000"
              keyboardType="number-pad"
              suffix="km"
            />
          </View>

          {/* Optionen */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setUpdateMileage(!updateMileage)}
          >
            <View style={[styles.checkbox, updateMileage && styles.checkboxActive]}>
              {updateMileage && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.optionText}>Fahrzeug-Kilometerstand aktualisieren</Text>
          </TouchableOpacity>

          {/* Geschäftskonto */}
          <TouchableOpacity
            style={[styles.optionRow, { marginTop: Spacing.sm, borderColor: isBusinessExpense ? Colors.primary : Colors.border, borderWidth: 1.5 }]}
            onPress={() => setIsBusinessExpense(!isBusinessExpense)}
          >
            <View style={[styles.checkbox, isBusinessExpense && styles.checkboxActive]}>
              {isBusinessExpense && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Ionicons name="business" size={16} color={isBusinessExpense ? Colors.primary : Colors.textTertiary} />
            <Text style={[styles.optionText, isBusinessExpense && { color: Colors.primary, fontWeight: FontWeight.semibold }]}>
              Geschäftliche Ausgabe (absetzbar)
            </Text>
          </TouchableOpacity>

          {isBusinessExpense && (
            <View style={[styles.formCard, { borderLeftWidth: 3, borderLeftColor: Colors.primary }]}>
              {/* Lieferant */}
              <FormField
                label="Lieferant / Werkstatt"
                value={supplier}
                onChangeText={setSupplier}
                placeholder="z.B. BMW Autohaus GmbH"
              />
              {/* Beleg-Nr */}
              <FormField
                label="Belegnummer / Rechnungsnummer"
                value={receiptNumber}
                onChangeText={setReceiptNumber}
                placeholder="z.B. RE-2024-00123"
              />
              {/* MwSt-Satz */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>MwSt-Satz</Text>
                <View style={styles.vatRow}>
                  {([0, 7, 19] as VatRate[]).map(rate => (
                    <TouchableOpacity
                      key={rate}
                      style={[styles.vatBtn, vatRate === rate && styles.vatBtnActive]}
                      onPress={() => setVatRate(rate)}
                    >
                      <Text style={[styles.vatBtnText, vatRate === rate && styles.vatBtnTextActive]}>
                        {rate}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {/* Geschäftlicher Anteil */}
              <FormField
                label="Geschäftlicher Anteil"
                value={businessRatio}
                onChangeText={setBusinessRatio}
                placeholder="100"
                keyboardType="number-pad"
                suffix="%"
              />
              {/* Live-Vorschau */}
              {cost !== '' && parseFloat(cost.replace(',', '.')) > 0 && (
                <View style={styles.vatPreview}>
                  {(() => {
                    const gross = parseFloat(cost.replace(',', '.'));
                    const { net, vat } = calcVat(gross, vatRate);
                    const ratio = parseInt(businessRatio) || 100;
                    const deductible = calcBusinessAmount(gross, ratio);
                    const { vat: dedVat } = calcVat(deductible, vatRate);
                    return (
                      <>
                        <VatRow label="Brutto" value={`${gross.toFixed(2)} €`} />
                        <VatRow label={`Netto (ohne ${vatRate}% MwSt)`} value={`${net.toFixed(2)} €`} />
                        <VatRow label="Enthaltene MwSt" value={`${vat.toFixed(2)} €`} />
                        <View style={styles.vatDivider} />
                        <VatRow label={`Absetzbar (${ratio}%)`} value={`${deductible.toFixed(2)} €`} bold />
                        <VatRow label="Vorsteuer-Erstattung" value={`${dedVat.toFixed(2)} €`} bold color={Colors.success} />
                      </>
                    );
                  })()}
                </View>
              )}
            </View>
          )}

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
  suffix?: string;
}

function FormField({ label, value, onChangeText, placeholder, keyboardType, multiline, suffix }: FormFieldProps) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
        />
        {suffix && <Text style={styles.inputSuffix}>{suffix}</Text>}
      </View>
    </View>
  );
}

function VatRow({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
      <Text style={{ fontSize: FontSize.xs, color: Colors.textSecondary }}>{label}</Text>
      <Text style={{ fontSize: FontSize.xs, fontWeight: bold ? FontWeight.bold : FontWeight.regular, color: color ?? Colors.text }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.sm,
  },
  scroll: { padding: Spacing.md },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    ...Shadow.small,
  },
  vehicleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  vehicleInfoText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
    marginLeft: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    backgroundColor: Colors.surface,
  },
  categoryBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  selectedCategoryText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    ...Shadow.small,
    marginBottom: Spacing.md,
  },
  fieldWrapper: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  fieldLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginBottom: 3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    paddingVertical: 2,
  },
  inputMultiline: {
    height: 72,
    textAlignVertical: 'top',
  },
  inputSuffix: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginLeft: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadow.small,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    flex: 1,
  },
  vatRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  vatBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  vatBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  vatBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  vatBtnTextActive: {
    color: '#fff',
  },
  vatPreview: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
  },
  vatDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
});
