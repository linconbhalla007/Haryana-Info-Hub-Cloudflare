import React from 'react';
import { Link } from 'react-router-dom';
import './SectionCard.css';

/**
 * The four large feature cards on the homepage (News / Orders / Jobs /
 * Schemes). Each links to its section and lists a few highlights.
 */
function SectionCard({ icon, title, items, buttonLabel, to, accent = 'saffron', onClick }) {
  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Link to={to} onClick={handleClick} className={`section-card section-card--${accent}`}>
      <div className="section-card__icon">{icon}</div>
      <h3 className="section-card__title">{title}</h3>
      <ul className="section-card__list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <span className="section-card__cta">
        {buttonLabel}
        <ArrowIcon />
      </span>
    </Link>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M13 6L19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default SectionCard;
