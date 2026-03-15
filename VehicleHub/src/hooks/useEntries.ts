import { useCallback, useEffect } from 'react';
import { VehicleEntry, EntryCategory } from '../types';
import { DUMMY_ENTRIES } from '../constants/dummyData';
import { useStorage } from './useStorage';
import { generateId } from '../utils/calculations';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@vehiclehub_entries';
const INITIALIZED_KEY = '@vehiclehub_entries_initialized';

export function useEntries() {
  const { data: entries, loading, saveData, reload } = useStorage<VehicleEntry[]>(
    STORAGE_KEY,
    []
  );

  useEffect(() => {
    initializeDummyData();
  }, []);

  const initializeDummyData = async () => {
    try {
      const initialized = await AsyncStorage.getItem(INITIALIZED_KEY);
      if (!initialized) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DUMMY_ENTRIES));
        await AsyncStorage.setItem(INITIALIZED_KEY, 'true');
        await reload();
      }
    } catch (e) {
      console.warn('Entries init error:', e);
    }
  };

  const addEntry = useCallback(
    async (entryData: Omit<VehicleEntry, 'id' | 'createdAt'>) => {
      const newEntry: VehicleEntry = {
        ...entryData,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      await saveData([...entries, newEntry]);
      return newEntry;
    },
    [entries, saveData]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      await saveData(entries.filter(e => e.id !== id));
    },
    [entries, saveData]
  );

  const getEntriesForVehicle = useCallback(
    (vehicleId: string): VehicleEntry[] =>
      entries
        .filter(e => e.vehicleId === vehicleId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [entries]
  );

  const getLastEntryByCategory = useCallback(
    (vehicleId: string, category: EntryCategory): VehicleEntry | undefined =>
      entries
        .filter(e => e.vehicleId === vehicleId && e.category === category)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0],
    [entries]
  );

  return { entries, loading, addEntry, deleteEntry, getEntriesForVehicle, getLastEntryByCategory };
}
