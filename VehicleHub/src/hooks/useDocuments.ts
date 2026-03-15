import { useCallback } from 'react';
import { VehicleDocument } from '../types';
import { useStorage } from './useStorage';
import { generateId } from '../utils/calculations';

const STORAGE_KEY = '@vehiclehub_documents';

export function useDocuments() {
  const { data: documents, loading, saveData } = useStorage<VehicleDocument[]>(STORAGE_KEY, []);

  const addDocument = useCallback(
    async (data: Omit<VehicleDocument, 'id' | 'createdAt'>) => {
      const doc: VehicleDocument = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      await saveData([...documents, doc]);
      return doc;
    },
    [documents, saveData]
  );

  const updateDocument = useCallback(
    async (id: string, updates: Partial<VehicleDocument>) => {
      await saveData(documents.map(d => d.id === id ? { ...d, ...updates } : d));
    },
    [documents, saveData]
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      await saveData(documents.filter(d => d.id !== id));
    },
    [documents, saveData]
  );

  const getDocumentsForVehicle = useCallback(
    (vehicleId: string) =>
      documents
        .filter(d => d.vehicleId === vehicleId)
        .sort((a, b) => {
          if (a.expiryDate && b.expiryDate) return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }),
    [documents]
  );

  const getExpiringDocuments = useCallback(
    (daysThreshold = 60) => {
      const now = new Date();
      return documents.filter(d => {
        if (!d.expiryDate) return false;
        const diff = (new Date(d.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diff < daysThreshold;
      }).sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime());
    },
    [documents]
  );

  return { documents, loading, addDocument, updateDocument, deleteDocument, getDocumentsForVehicle, getExpiringDocuments };
}
