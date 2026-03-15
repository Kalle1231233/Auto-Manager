import { useCallback } from 'react';
import { TripEntry } from '../types';
import { useStorage } from './useStorage';
import { generateId } from '../utils/calculations';

const STORAGE_KEY = '@vehiclehub_trips';

export function useTrips() {
  const { data: trips, loading, saveData } = useStorage<TripEntry[]>(STORAGE_KEY, []);

  const addTrip = useCallback(
    async (tripData: Omit<TripEntry, 'id' | 'createdAt' | 'distance'>) => {
      const newTrip: TripEntry = {
        ...tripData,
        distance: tripData.endMileage - tripData.startMileage,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      await saveData([...trips, newTrip]);
      return newTrip;
    },
    [trips, saveData]
  );

  const deleteTrip = useCallback(
    async (id: string) => {
      await saveData(trips.filter(t => t.id !== id));
    },
    [trips, saveData]
  );

  const getTripsForVehicle = useCallback(
    (vehicleId: string) =>
      trips
        .filter(t => t.vehicleId === vehicleId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [trips]
  );

  return { trips, loading, addTrip, deleteTrip, getTripsForVehicle };
}
