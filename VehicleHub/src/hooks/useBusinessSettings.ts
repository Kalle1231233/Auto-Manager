import { useCallback } from 'react';
import { BusinessSettings } from '../types';
import { useStorage } from './useStorage';

const STORAGE_KEY = '@vehiclehub_business';

const DEFAULT_SETTINGS: BusinessSettings = {
  enabled: false,
  companyName: '',
  vatId: '',
  defaultVatRate: 19,
  defaultBusinessRatio: 100,
};

export function useBusinessSettings() {
  const { data: settings, loading, saveData } = useStorage<BusinessSettings>(
    STORAGE_KEY,
    DEFAULT_SETTINGS
  );

  const updateSettings = useCallback(
    async (updates: Partial<BusinessSettings>) => {
      await saveData({ ...settings, ...updates });
    },
    [settings, saveData]
  );

  return { settings, loading, updateSettings };
}
