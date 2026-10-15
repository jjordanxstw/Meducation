import { Injectable } from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Upper bound on cached responses. Render Free has 512 MB; without a cap,
 * requests with ever-changing query strings could grow the map forever (S6).
 */
export const RESPONSE_CACHE_MAX_ENTRIES = 500;

@Injectable()
export class ResponseCacheService {
  // Map iteration order is insertion order, so the first key is always the
  // least recently used one (get() re-inserts on hit).
  private readonly store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }

    this.store.delete(key);
    this.store.set(key, entry);
    return this.clone(entry.value) as T;
  }

  set<T>(key: string, value: T, ttlSeconds: number): void {
    if (ttlSeconds <= 0) {
      return;
    }

    this.store.delete(key);
    this.store.set(key, {
      value: this.clone(value),
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    while (this.store.size > RESPONSE_CACHE_MAX_ENTRIES) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey === undefined) break;
      this.store.delete(oldestKey);
    }
  }

  get size(): number {
    return this.store.size;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  deleteByPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  deleteByPrefixes(prefixes: string[]): void {
    for (const prefix of prefixes) {
      this.deleteByPrefix(prefix);
    }
  }

  private clone<T>(value: T): T {
    if (typeof structuredClone === 'function') {
      return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value)) as T;
  }
}
