import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useStorage<T>(key: string, initialValue: T) {
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [key]);

  const loadData = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (stored !== null) {
        setData(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Storage load error:', e);
    } finally {
      setLoading(false);
    }
  }, [key]);

  const saveData = useCallback(async (newData: T) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(newData));
      setData(newData);
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }, [key]);

  return { data, loading, saveData, reload: loadData };
}
