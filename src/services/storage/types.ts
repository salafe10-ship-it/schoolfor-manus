export type StorageCategory = 'A' | 'B' | 'C';

export interface StoragePolicy {
  category: StorageCategory;
  persist: boolean; // Should it be saved to persistent storage (e.g., localStorage) or just sessionStorage?
}

export interface StorageService {
  getItem<T>(key: string): T | null;
  setItem<T>(key: string, value: T): void;
  removeItem(key: string): void;
  clear(): void;
}
