import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchBar.css';

/**
 * Header search control.
 * - Desktop: click the icon to expand an inline input; Enter/submit routes
 *   to /search?q=...
 * - Mobile: the icon routes straight to the dedicated /search page, which
 *   has its own full-width input (better for small screens).
 */
function SearchBar({ variant = 'desktop' }) {
  const [expanded, setExpanded] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (expanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [expanded]);

  function goToSearch(q) {
    const query = q.trim();
    navigate(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
  }

  function handleSubmit(e) {
    e.preventDefault();
    goToSearch(value);
    setExpanded(false);
  }

  if (variant === 'mobile') {
    return (
      <button
        type="button"
        className="searchbar__icon-btn"
        aria-label="खोजें"
        onClick={() => navigate('/search')}
      >
        <SearchIcon />
      </button>
    );
  }

  return (
    <div className={`searchbar ${expanded ? 'searchbar--expanded' : ''}`}>
      {expanded ? (
        <form className="searchbar__form" onSubmit={handleSubmit}>
          <SearchIcon />
          <input
            ref={inputRef}
            type="text"
            className="searchbar__input"
            placeholder="हरियाणा जानकारी खोजें..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => {
              if (!value) setExpanded(false);
            }}
          />
        </form>
      ) : (
        <button
          type="button"
          className="searchbar__icon-btn"
          aria-label="खोजें"
          onClick={() => setExpanded(true)}
        >
          <SearchIcon />
        </button>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default SearchBar;
