import React, { useState, useEffect } from 'react';
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';

import { useVehicles } from '../hooks/useVehicles';
import { FuelType, RootStackParamList } from '../types';
import { FUEL_TYPE_LABELS } from '../constants/categories';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../constants/theme';

type Nav = StackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'AddVehicle'>;

const FUEL_TYPES: FuelType[] = ['benzin', 'diesel', 'elektro', 'hybrid', 'lpg', 'wasserstoff'];
const VEHICLE_COLORS = [
  '#1A1A1A', '#2C3E50', '#2980B9', '#27AE60', '#E74C3C',
  '#8E44AD', '#F39C12', '#ECF0F1', '#BDC3C7', '#E8E8E8',
];

export function AddVehicleScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { vehicleId } = route.params ?? {};

  const { addVehicle, updateVehicle, getVehicle } = useVehicles();
  const existingVehicle = vehicleId ? getVehicle(vehicleId) : undefined;
  const isEditing = !!existingVehicle;

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [licensePlate, setLicensePlate] = useState('');
  const [mileage, setMileage] = useState('');
  const [fuelType, setFuelType] = useState<FuelType>('benzin');
  const [color, setColor] = useState(VEHICLE_COLORS[0]);
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);
  const [vin, setVin] = useState('');
  const [tuevDate, setTuevDate] = useState('');
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [nextServiceMileage, setNextServiceMileage] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (existingVehicle) {
      setName(existingVehicle.name);
      setBrand(existingVehicle.brand);
      setModel(existingVehicle.model);
      setYear(String(existingVehicle.year));
      setLicensePlate(existingVehicle.licensePlate);
      setMileage(String(existingVehicle.mileage));
      setFuelType(existingVehicle.fuelType);
      setColor(existingVehicle.color);
      setImageBase64(existingVehicle.imageBase64);
      setVin(existingVehicle.vin ?? '');
      setTuevDate(existingVehicle.tuevDate ? formatDateForInput(existingVehicle.tuevDate) : '');
      setNextServiceDate(existingVehicle.nextServiceDate ? formatDateForInput(existingVehicle.nextServiceDate) : '');
      setNextServiceMileage(existingVehicle.nextServiceMileage ? String(existingVehicle.nextServiceMileage) : '');
      setNotes(existingVehicle.notes ?? '');
    }
  }, [existingVehicle]);

  function formatDateForInput(isoDate: string): string {
    const d = new Date(isoDate);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const yearStr = d.getFullYear();
    return `${day}.${month}.${yearStr}`;
  }

  const pickImage = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Berechtigung benötigt', 'Bitte erlaube den Zugriff auf die Fotobibliothek.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setImageBase64(result.assets[0].base64);
    }
  };

  function parseInputDate(input: string): string | undefined {
    const parts = input.split('.');
    if (parts.length !== 3) return undefined;
    const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString();
  }

  const handleSave = async () => {
    if (!name.trim() || !brand.trim() || !model.trim() || !licensePlate.trim()) {
      Alert.alert('Pflichtfelder', 'Bitte fülle Name, Marke, Modell und Kennzeichen aus.');
      return;
    }

    const parsedYear = parseInt(year);
    const parsedMileage = parseInt(mileage) || 0;

    const data = {
      name: name.trim(),
      brand: brand.trim(),
      model: model.trim(),
      year: isNaN(parsedYear) ? new Date().getFullYear() : parsedYear,
      licensePlate: licensePlate.trim().toUpperCase(),
      mileage: parsedMileage,
      fuelType,
      color,
      imageBase64,
      vin: vin.trim() || undefined,
      tuevDate: tuevDate ? parseInputDate(tuevDate) : undefined,
      nextServiceDate: nextServiceDate ? parseInputDate(nextServiceDate) : undefined,
      nextServiceMileage: nextServiceMileage ? parseInt(nextServiceMileage) : undefined,
      notes: notes.trim() || undefined,
    };

    if (isEditing && vehicleId) {
      await updateVehicle(vehicleId, data);
      navigation.goBack();
    } else {
      const v = await addVehicle(data);
      navigation.navigate('VehicleDetail', { vehicleId: v.id });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Nav Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>{isEditing ? 'Fahrzeug bearbeiten' : 'Neues Fahrzeug'}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Speichern</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Bild & Farbe */}
          <View style={styles.colorSection}>
            <TouchableOpacity
              style={[styles.colorPreview, { backgroundColor: color }]}
              onPress={pickImage}
              activeOpacity={0.8}
            >
              {imageBase64 ? (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${imageBase64}` }}
                  style={styles.vehicleImage}
                />
              ) : (
                <>
                  <Ionicons name="car" size={36} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.imageHint}>Foto hinzufügen</Text>
                </>
              )}
              <View style={styles.cameraOverlay}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
            {imageBase64 && (
              <TouchableOpacity onPress={() => setImageBase64(undefined)} style={styles.removeImage}>
                <Ionicons name="close-circle" size={16} color={Colors.danger} />
                <Text style={styles.removeImageText}>Bild entfernen</Text>
              </TouchableOpacity>
            )}
            <View style={styles.colorPicker}>
              {VEHICLE_COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    color === c && styles.colorDotSelected,
                  ]}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>
          </View>

          {/* Grunddaten */}
          <FormSection title="Grunddaten">
            <FormField
              label="Spitzname / Name *"
              value={name}
              onChangeText={setName}
              placeholder="z.B. Mein Golf"
            />
            <FormField
              label="Marke *"
              value={brand}
              onChangeText={setBrand}
              placeholder="z.B. Volkswagen"
            />
            <FormField
              label="Modell *"
              value={model}
              onChangeText={setModel}
              placeholder="z.B. Golf 8"
            />
            <FormRow>
              <FormField
                label="Baujahr"
                value={year}
                onChangeText={setYear}
                placeholder="2021"
                keyboardType="number-pad"
                flex
              />
              <FormField
                label="Kilometerstand"
                value={mileage}
                onChangeText={setMileage}
                placeholder="0"
                keyboardType="number-pad"
                suffix="km"
                flex
              />
            </FormRow>
            <FormField
              label="Kennzeichen *"
              value={licensePlate}
              onChangeText={setLicensePlate}
              placeholder="M-AB 1234"
              autoCapitalize="characters"
            />
          </FormSection>

          {/* Kraftstoff */}
          <FormSection title="Kraftstoff">
            <View style={styles.fuelGrid}>
              {FUEL_TYPES.map(ft => (
                <TouchableOpacity
                  key={ft}
                  style={[styles.fuelOption, fuelType === ft && styles.fuelOptionActive]}
                  onPress={() => setFuelType(ft)}
                >
                  <Text style={[styles.fuelOptionText, fuelType === ft && styles.fuelOptionTextActive]}>
                    {FUEL_TYPE_LABELS[ft]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </FormSection>

          {/* Termine */}
          <FormSection title="Termine & Service">
            <FormField
              label="TÜV-Datum"
              value={tuevDate}
              onChangeText={setTuevDate}
              placeholder="TT.MM.JJJJ"
              keyboardType="numbers-and-punctuation"
            />
            <FormField
              label="Nächster Service (Datum)"
              value={nextServiceDate}
              onChangeText={setNextServiceDate}
              placeholder="TT.MM.JJJJ"
              keyboardType="numbers-and-punctuation"
            />
            <FormField
              label="Nächster Service (km)"
              value={nextServiceMileage}
              onChangeText={setNextServiceMileage}
              placeholder="50000"
              keyboardType="number-pad"
              suffix="km"
            />
          </FormSection>

          {/* Sonstiges */}
          <FormSection title="Sonstiges">
            <FormField
              label="VIN (optional)"
              value={vin}
              onChangeText={setVin}
              placeholder="WVWZZZ1JZXW000001"
              autoCapitalize="characters"
            />
            <FormField
              label="Notizen"
              value={notes}
              onChangeText={setNotes}
              placeholder="Eigene Notizen…"
              multiline
            />
          </FormSection>

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.formSection}>
      <Text style={styles.formSectionTitle}>{title}</Text>
      <View style={styles.formCard}>{children}</View>
    </View>
  );
}

function FormRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.formRow}>{children}</View>;
}

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
  autoCapitalize?: any;
  multiline?: boolean;
  suffix?: string;
  flex?: boolean;
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  multiline,
  suffix,
  flex,
}: FormFieldProps) {
  return (
    <View style={[styles.fieldWrapper, flex && { flex: 1 }]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'sentences'}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
        />
        {suffix && <Text style={styles.inputSuffix}>{suffix}</Text>}
      </View>
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
  scroll: {
    padding: Spacing.md,
  },
  colorSection: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  colorPreview: {
    width: 160,
    height: 100,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    ...Shadow.medium,
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.lg,
  },
  imageHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.xs,
    marginTop: 4,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
    padding: 4,
  },
  removeImage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  removeImageText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: Colors.primary,
    transform: [{ scale: 1.2 }],
  },
  formSection: {
    marginBottom: Spacing.md,
  },
  formSectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    ...Shadow.small,
    gap: 0,
  },
  formRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
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
  fuelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  fuelOption: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fuelOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  fuelOptionText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  fuelOptionTextActive: {
    color: '#fff',
  },
});
