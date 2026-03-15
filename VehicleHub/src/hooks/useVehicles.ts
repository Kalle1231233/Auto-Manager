import { useCallback, useEffect } from 'react';
import { Vehicle } from '../types';
import { DUMMY_VEHICLES } from '../constants/dummyData';
import { useStorage } from './useStorage';
import { generateId } from '../utils/calculations';

const STORAGE_KEY = '@vehiclehub_vehicles';
const INITIALIZED_KEY = '@vehiclehub_initialized';

import AsyncStorage from '@react-native-async-storage/async-storage';

export function useVehicles() {
  const { data: vehicles, loading, saveData, reload } = useStorage<Vehicle[]>(
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
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DUMMY_VEHICLES));
        await AsyncStorage.setItem(INITIALIZED_KEY, 'true');
        await reload();
      }
    } catch (e) {
      console.warn('Init error:', e);
    }
  };

  const addVehicle = useCallback(
    async (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newVehicle: Vehicle = {
        ...vehicleData,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveData([...vehicles, newVehicle]);
      return newVehicle;
    },
    [vehicles, saveData]
  );

  const updateVehicle = useCallback(
    async (id: string, updates: Partial<Vehicle>) => {
      const updated = vehicles.map(v =>
        v.id === id ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v
      );
      await saveData(updated);
    },
    [vehicles, saveData]
  );

  const deleteVehicle = useCallback(
    async (id: string) => {
      await saveData(vehicles.filter(v => v.id !== id));
    },
    [vehicles, saveData]
  );

  const getVehicle = useCallback(
    (id: string) => vehicles.find(v => v.id === id),
    [vehicles]
  );

  return { vehicles, loading, addVehicle, updateVehicle, deleteVehicle, getVehicle };
}
