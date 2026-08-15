type CacheEntry = { value: ReadonlySet<string>; expiresAt: number };

export class PermissionCache {
  private readonly entries = new Map<string, CacheEntry>();

  constructor(private readonly ttlMs = 30_000, private readonly maxEntries = 256) {}

  get(key: string): ReadonlySet<string> | null {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: ReadonlySet<string>): void {
    if (this.entries.size >= this.maxEntries && !this.entries.has(key)) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey) this.entries.delete(oldestKey);
    }
    this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  clear(): void {
    this.entries.clear();
  }
}
