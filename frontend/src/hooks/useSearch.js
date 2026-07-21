import { useState, useCallback, useMemo } from 'react';

const useSearch = (items = [], searchFields = []) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;

    const lowerSearchTerm = searchTerm.toLowerCase();

    return items.filter(item => {
      return searchFields.some(field => {
        const value = String(item[field] || '').toLowerCase();
        return value.includes(lowerSearchTerm);
      });
    });
  }, [items, searchTerm, searchFields]);

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const handleCancel = useCallback(() => {
    setSearchTerm('');
  }, []);

  return {
    searchTerm,
    filteredItems,
    handleSearch,
    handleCancel,
    setSearchTerm
  };
};

export default useSearch;