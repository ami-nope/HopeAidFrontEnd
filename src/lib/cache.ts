/**
 * Hybrid cache system:
 * - Server-side: Redis (all data for fast access)
 * - Browser cache: localStorage (non-sensitive data only)
 * - In-memory: Map (session-only, cleared on refresh)
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

type DataSensitivity = 'public' | 'internal' | 'sensitive';

interface CacheConfig {
  /** Cache sensitivity level */
  sensitivity: DataSensitivity;
  /** Whether to cache in browser localStorage */
  browserCache: boolean;
  /** Whether to use server-side cache (always true) */
  serverCache: boolean;
}

/**
 * Data sensitivity classification
 */
const DATA_SENSITIVITY: Record<string, DataSensitivity> = {
  // Public - safe to browser cache
  dashboard: 'public',
  cases_count: 'public',
  volunteers_count: 'public',
  households_count: 'public',
  inventory_count: 'public',
  alerts_count: 'public',
  case_status: 'public',
  case_category: 'public',

  // Internal - server cache only
  cases_full: 'internal',
  volunteers_full: 'internal',
  households_full: 'internal',
  inventory_full: 'internal',
  alerts_full: 'internal',
  audit_logs: 'internal',

  // Sensitive - NO browser cache, server only
  case_details: 'sensitive',
  household_details: 'sensitive',
  volunteer_details: 'sensitive',
  contact_info: 'sensitive',
};

const CACHE_CONFIG: Record<DataSensitivity, CacheConfig> = {
  public: {
    sensitivity: 'public',
    browserCache: true, // Safe to cache in localStorage
    serverCache: true,
  },
  internal: {
    sensitivity: 'internal',
    browserCache: false, // Don't cache business logic in browser
    serverCache: true,
  },
  sensitive: {
    sensitivity: 'sensitive',
    browserCache: false, // NEVER cache sensitive data locally
    serverCache: true,
  },
};

class CacheManager {
  private memory = new Map<string, CacheEntry<unknown>>();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Get cached data if it exists and hasn't expired
   * Checks memory first, then browser cache
   */
  get<T>(key: string, ttl: number, sensitivity: DataSensitivity = 'internal'): T | null {
    const config = CACHE_CONFIG[sensitivity];

    // Always check memory cache first (session)
    const memEntry = this.memory.get(key);
    if (memEntry) {
      const now = Date.now();
      const age = now - memEntry.timestamp;

      if (age <= ttl) {
        return memEntry.data as T;
      }

      this.memory.delete(key);
    }

    // Check browser cache only for public data
    if (config.browserCache && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const entry = JSON.parse(stored);
          const now = Date.now();
          const age = now - entry.timestamp;

          if (age <= ttl) {
            // Restore to memory for fast access
            this.memory.set(key, entry);
            return entry.data as T;
          }

          localStorage.removeItem(key);
        }
      } catch (error) {
        console.error(`Failed to read browser cache for ${key}:`, error);
      }
    }

    return null;
  }

  /**
   * Set data in cache
   * Stores in memory always
   * Also stores in browser localStorage only if sensitivity allows
   * Server-side caching happens via API interceptor (Redis on backend)
   */
  set<T>(key: string, data: T, sensitivity: DataSensitivity = 'internal'): void {
    const entry = { data, timestamp: Date.now() };
    const config = CACHE_CONFIG[sensitivity];

    // Always store in memory for session access
    this.memory.set(key, entry);

    // Store in browser localStorage only for public data
    if (config.browserCache && typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(entry));
      } catch (error) {
        console.error(`Failed to write browser cache for ${key}:`, error);
      }
    }

    // Note: Server-side caching (Redis) is handled by API response interceptor
    // All API responses with cache headers are automatically cached server-side
  }

  /**
   * Check if cache entry exists and is valid
   */
  isValid(key: string, ttl: number, sensitivity: DataSensitivity = 'internal'): boolean {
    const config = CACHE_CONFIG[sensitivity];
    const memEntry = this.memory.get(key);

    if (memEntry) {
      const now = Date.now();
      const age = now - memEntry.timestamp;
      return age <= ttl;
    }

    // Check browser cache
    if (config.browserCache && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const entry = JSON.parse(stored);
          const now = Date.now();
          const age = now - entry.timestamp;
          return age <= ttl;
        }
      } catch (error) {
        console.error(`Failed to check browser cache for ${key}:`, error);
      }
    }

    return false;
  }

  /**
   * Clear specific cache entry (all layers)
   */
  clear(key: string): void {
    this.memory.delete(key);

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Failed to clear browser cache for ${key}:`, error);
      }
    }

    if (this.intervals.has(key)) {
      clearInterval(this.intervals.get(key));
      this.intervals.delete(key);
    }
  }

  /**
   * Clear all cache (all layers)
   */
  clearAll(): void {
    this.memory.clear();

    if (typeof window !== 'undefined') {
      try {
        localStorage.clear();
      } catch (error) {
        console.error('Failed to clear browser cache:', error);
      }
    }

    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();
  }

  /**
   * Set up periodic refresh for a cache key
   */
  setRefreshInterval(key: string, ttl: number, callback: () => Promise<void>): void {
    // Clear existing interval if any
    if (this.intervals.has(key)) {
      clearInterval(this.intervals.get(key));
    }

    // Set up new interval to refresh before expiry
    const intervalId = setInterval(async () => {
      try {
        await callback();
      } catch (error) {
        console.error(`Cache refresh failed for key: ${key}`, error);
      }
    }, ttl);

    this.intervals.set(key, intervalId);
  }

  /**
   * Clear refresh interval
   */
  clearRefreshInterval(key: string): void {
    if (this.intervals.has(key)) {
      clearInterval(this.intervals.get(key));
      this.intervals.delete(key);
    }
  }
}


export const cacheManager = new CacheManager();

/**
 * Get data sensitivity level for a cache key
 */
export function getDataSensitivity(cacheKey: string): DataSensitivity {
  return DATA_SENSITIVITY[cacheKey] || 'internal';
}

/**
 * Default cache TTLs (in milliseconds)
 */
export const DEFAULT_CACHE_TTL = {
  DASHBOARD: 5 * 60 * 1000, // 5 minutes
  CASES: 3 * 60 * 1000, // 3 minutes
  VOLUNTEERS: 3 * 60 * 1000, // 3 minutes
  HOUSEHOLDS: 5 * 60 * 1000, // 5 minutes
  INVENTORY: 5 * 60 * 1000, // 5 minutes
  ALERTS: 1 * 60 * 1000, // 1 minute - refresh more frequently
  AUDIT_LOGS: 5 * 60 * 1000, // 5 minutes
  ORGANIZATIONS: 10 * 60 * 1000, // 10 minutes
  USERS: 10 * 60 * 1000, // 10 minutes
} as const;

export type { DataSensitivity, CacheConfig };
