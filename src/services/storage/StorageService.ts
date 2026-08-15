import { StorageService } from './types';
import { STORAGE_POLICIES } from './policies';

class BrowserStorageService implements StorageService {
  getItem<T>(key: string): T | null {
    const policy = STORAGE_POLICIES[key];
    const storage = (policy && policy.persist) ? localStorage : sessionStorage;
    
    const value = storage.getItem(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  setItem<T>(key: string, value: T): void {
    const policy = STORAGE_POLICIES[key];
    
    if (policy && policy.category === 'C') {
        console.warn(`Attempted to store sensitive data in browser storage: ${key}`);
        // In a real scenario, this should trigger a migration to DB or alert.
    }

    const storage = (policy && policy.persist) ? localStorage : sessionStorage;
    storage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
    sessionStorage.clear();
  }
  audit(): void {
    const keys = Object.keys(STORAGE_POLICIES);
    console.log('--- Storage Audit Report ---');
    console.log(`Total Keys: ${localStorage.length + sessionStorage.length}`);
    console.log(`Allowed Keys: ${keys.length}`);
    // ... further implementation
  }
}

export const storageService = new BrowserStorageService();
