import React, { useState, useCallback } from 'react';
import { IoSearchOutline, IoCloseOutline } from 'react-icons/io5';
import './SearchBar.css';

const SearchBar = ({ 
  onSearch, 
  placeholder = "Search...",
  onCancel,
  debounceDelay = 300
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer for debounced search
    const timer = setTimeout(() => {
      onSearch(value);
    }, debounceDelay);

    setDebounceTimer(timer);
  }, [debounceTimer, debounceDelay, onSearch]);

  const handleCancel = useCallback(() => {
    setSearchTerm('');
    setIsActive(false);
    onSearch('');
    if (onCancel) {
      onCancel();
    }
  }, [onSearch, onCancel]);

  const handleFocus = () => {
    setIsActive(true);
  };

  const handleBlur = () => {
    // Delay blur to allow cancel button click
    setTimeout(() => {
      if (!searchTerm) {
        setIsActive(false);
      }
    }, 100);
  };

  return (
    <div className="search-bar-wrapper">
      <div className={`search-bar ${isActive ? 'active' : ''} ${searchTerm ? 'has-text' : ''}`}>
        <IoSearchOutline className="search-icon" />
        
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="search-input"
          autoComplete="off"
        />

        {searchTerm && (
          <button
            className="cancel-btn"
            onClick={handleCancel}
            title="Clear search"
            type="button"
            aria-label="Clear search"
          >
            <IoCloseOutline className="close-icon" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;