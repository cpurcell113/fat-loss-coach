import { useState, useCallback, useEffect } from 'react';
import { getCollection, setCollection, addItem, updateItem, deleteItem } from './storage';

export function useStorage<T extends { id: string }>(key: string) {
  const [data, setData] = useState<T[]>(() => getCollection<T>(key));

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'fla_' + key) {
        setData(e.newValue ? JSON.parse(e.newValue) : []);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [key]);

  const add = useCallback((item: T) => {
    addItem(key, item);
    setData(prev => [...prev, item]);
  }, [key]);

  const update = useCallback((id: string, updates: Partial<T>) => {
    updateItem(key, id, updates);
    setData(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  }, [key]);

  const remove = useCallback((id: string) => {
    deleteItem(key, id);
    setData(prev => prev.filter(item => item.id !== id));
  }, [key]);

  const replace = useCallback((newData: T[]) => {
    setCollection(key, newData);
    setData(newData);
  }, [key]);

  return { data, add, update, remove, replace };
}
