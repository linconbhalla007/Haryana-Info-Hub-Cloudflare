import React from 'react';

function ListToolbar({ value, onChange, placeholder, count }) {
  return (
    <div className="list-toolbar">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      <span className="list-toolbar__count">{count} परिणाम</span>
    </div>
  );
}

export default ListToolbar;
