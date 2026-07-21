import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const useUrlSearchQuery = (initial = '') => {
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(urlQuery || initial);

  useEffect(() => {
    if (urlQuery) {
      setSearchTerm(urlQuery);
    }
  }, [urlQuery]);

  return [searchTerm, setSearchTerm];
};

export default useUrlSearchQuery;
