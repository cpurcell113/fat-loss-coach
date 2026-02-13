const PREFIX = 'fla_';

export function getCollection<T>(key: string): T[] {
  const raw = localStorage.getItem(PREFIX + key);
  return raw ? JSON.parse(raw) : [];
}

export function setCollection<T>(key: string, data: T[]): void {
  localStorage.setItem(PREFIX + key, JSON.stringify(data));
}

export function addItem<T extends { id: string }>(key: string, item: T): void {
  const collection = getCollection<T>(key);
  collection.push(item);
  setCollection(key, collection);
}

export function updateItem<T extends { id: string }>(key: string, id: string, updates: Partial<T>): void {
  const collection = getCollection<T>(key);
  const idx = collection.findIndex(item => item.id === id);
  if (idx !== -1) {
    collection[idx] = { ...collection[idx], ...updates };
    setCollection(key, collection);
  }
}

export function deleteItem<T extends { id: string }>(key: string, id: string): void {
  const collection = getCollection<T>(key);
  setCollection(key, collection.filter(item => item.id !== id));
}

export function getSettings<T>(key: string): T | null {
  const raw = localStorage.getItem(PREFIX + key);
  return raw ? JSON.parse(raw) : null;
}

export function setSettings<T>(key: string, data: T): void {
  localStorage.setItem(PREFIX + key, JSON.stringify(data));
}
