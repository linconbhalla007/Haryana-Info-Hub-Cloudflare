import React from 'react';
import './EmptyState.css';

function EmptyState({ title = 'कोई परिणाम नहीं मिला', message, }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon" aria-hidden="true">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
          <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
    </div>
  );
}

export default EmptyState;
