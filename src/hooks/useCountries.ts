import { useState, useEffect } from 'react';
import { publicApiCall } from '@/lib/api';

export interface Country {
  _id?: string;
  name: string;
  code?: string;
  isActive?: boolean;
}

interface CountriesCache {
  countries: Country[];
  timestamp: number;
}

// Module-level cache to share data across all hook instances
let globalCountriesCache: CountriesCache | null = null;
let globalFetchPromise: Promise<Country[]> | null = null;

// Cache duration: 1 hour (3600000 ms) - countries don't change frequently
const CACHE_DURATION = 60 * 60 * 1000;

// Initialize cache from sessionStorage if available
const initializeCache = (): CountriesCache | null => {
  if (typeof window !== "undefined") {
    try {
      const cached = sessionStorage.getItem("countriesCache");
      if (cached) {
        const parsedCache = JSON.parse(cached) as CountriesCache;
        const now = Date.now();
        const cacheValid = (now - parsedCache.timestamp) < CACHE_DURATION;
        if (cacheValid) {
          globalCountriesCache = parsedCache;
          return parsedCache;
        } else {
          // Cache expired, clear it
          sessionStorage.removeItem("countriesCache");
        }
      }
    } catch (error) {
      console.error("Error loading countries cache:", error);
      sessionStorage.removeItem("countriesCache");
    }
  }
  return null;
};

// Initialize cache on module load
if (typeof window !== "undefined") {
  initializeCache();
}

export function useCountries() {
  const [countries, setCountries] = useState(globalCountriesCache?.countries || ([] as Country[]));
  const [isLoading, setIsLoading] = useState(!globalCountriesCache);
  const [error, setError] = useState(null as string | null);

  useEffect(() => {
    // Check if we already have valid cached data
    if (globalCountriesCache && globalCountriesCache.countries.length > 0) {
      setCountries(globalCountriesCache.countries);
      setIsLoading(false);
      return;
    }

    // If there's already a fetch in progress, wait for it
    if (globalFetchPromise) {
      setIsLoading(true);
      globalFetchPromise
        .then((sorted) => {
          setCountries(sorted);
          setIsLoading(false);
        })
        .catch((err: any) => {
          setError(err.message || 'Failed to fetch countries');
          setIsLoading(false);
        });
      return;
    }

    // Start a new fetch
    setIsLoading(true);
    setError(null);

    globalFetchPromise = (async () => {
      try {
        const data = await publicApiCall<Country[]>('/common/countries');
        // Sort countries alphabetically by name
        const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
        
        // Update global cache
        const cache: CountriesCache = {
          countries: sorted,
          timestamp: Date.now(),
        };
        globalCountriesCache = cache;
        
        // Persist to sessionStorage
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem("countriesCache", JSON.stringify(cache));
          } catch (err) {
            console.error("Error saving countries cache:", err);
          }
        }
        
        // Clear the promise so future calls can fetch again if needed
        globalFetchPromise = null;
        
        return sorted;
      } catch (err: any) {
        globalFetchPromise = null;
        throw err;
      }
    })();

    globalFetchPromise
      .then((sorted) => {
        setCountries(sorted);
        setIsLoading(false);
      })
      .catch((err: any) => {
        setError(err.message || 'Failed to fetch countries');
        console.error('Error fetching countries:', err);
        setIsLoading(false);
      });
  }, []);

  return { countries, isLoading, error };
}

