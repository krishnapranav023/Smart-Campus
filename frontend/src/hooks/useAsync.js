import { useState, useCallback } from 'react';

/**
 * useAsync - Generic hook for handling async operations
 * @param {Function} asyncFn - The async function to execute
 * @returns {Object} { loading, error, data, execute }
 */
export const useAsync = (asyncFn) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(undefined);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn(...args);
      // Handle the standardized response format { success, data }
      const responseData = result.data?.data ?? result.data;
      setData(responseData);
      return result;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'An unexpected error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [asyncFn]);

  return { loading, error, data, execute };
};

export default useAsync;
