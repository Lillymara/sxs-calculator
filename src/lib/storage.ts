import { useEffect, useState } from "react";

/** useState that persists to localStorage; falls back to memory if storage is unavailable. */
export function usePersistentState<T extends object>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? { ...initial, ...JSON.parse(stored) } : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Private mode or blocked storage: keep working without saving.
    }
  }, [key, value]);

  return [value, setValue];
}
