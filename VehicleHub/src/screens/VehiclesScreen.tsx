import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useVehicles } from '../hooks/useVehicles';
import { useEntries } from '../hooks/useEntries';
import { VehicleCard } from '../components/VehicleCard';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { Colors, Spacing, FontSize, FontWeight } from '../constants/theme';
import { RootStackParamList } from '../types';

type Nav = StackNavigationProp<RootStackParamList>;

export function VehiclesScreen() {
  const navigation = useNavigation<Nav>();
  const { vehicles } = useVehicles();
  const { entries } = useEntries();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Fahrzeuge</Text>
        <Text style={styles.count}>{vehicles.length} Fahrzeug{vehicles.length !== 1 ? 'e' : ''}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {vehicles.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="car-outline" size={72} color={Colors.border} />
            <Text style={styles.emptyTitle}>Keine Fahrzeuge</Text>
            <Text style={styles.emptyText}>Tippe auf + um dein erstes Fahrzeug anzulegen</Text>
          </View>
        ) : (
          vehicles.map(v => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              entries={entries}
              onPress={() => navigation.navigate('VehicleDetail', { vehicleId: v.id })}
            />
          ))
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      <FloatingActionButton onPress={() => navigation.navigate('AddVehicle', {})} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  count: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  scroll: {
    paddingHorizontal: Spacing.md,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Spacing.xxl * 2,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
