import { useCallback } from 'react';
import { UserProfile, EmployeeRole } from '../types';
import { useStorage } from './useStorage';
import { generateId } from '../utils/calculations';

const STORAGE_KEY = '@vehiclehub_profile';

const DEFAULT_PROFILE: UserProfile = {
  id: 'owner',
  name: 'Mein Profil',
  role: 'admin',
  isOwner: true,
  createdAt: new Date().toISOString(),
};

export function useUserProfile() {
  const { data: profile, loading, saveData } = useStorage<UserProfile>(STORAGE_KEY, DEFAULT_PROFILE);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      await saveData({ ...profile, ...updates });
    },
    [profile, saveData]
  );

  return { profile, loading, updateProfile };
}
