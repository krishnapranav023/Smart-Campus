import { useState, useEffect } from 'react';

/**
 * useDebounce - Prevents frequent state updates (e.g., search inputs)
 * @param {any} value - The value to debounce
 * @param {number} delay - The delay in ms (default 400)
 * @returns {any} The debounced value
 */
export const useDebounce = (value, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
