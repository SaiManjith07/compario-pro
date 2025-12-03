'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SearchHistoryEntry } from '@/lib/types';

const HISTORY_KEY = 'priceWiseSearchHistory';
const MAX_HISTORY_ITEMS = 10;

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error('Failed to load search history from localStorage', error);
    }
    setIsLoaded(true);
  }, []);

  const addHistoryEntry = useCallback((newEntry: Omit<SearchHistoryEntry, 'id' | 'timestamp'>) => {
    setHistory(prevHistory => {
      const entryWithMeta: SearchHistoryEntry = {
        ...newEntry,
        id: new Date().toISOString() + Math.random(),
        timestamp: new Date().toISOString(),
      };
      
      const updatedHistory = [entryWithMeta, ...prevHistory]
        .filter((item, index, self) => 
          index === self.findIndex((t) => (
            t.productName === item.productName
          ))
        )
        .slice(0, MAX_HISTORY_ITEMS);

      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
      } catch (error) {
        console.error('Failed to save search history to localStorage', error);
      }
      return updatedHistory;
    });
  }, []);

  return { history, addHistoryEntry, isLoaded };
}
