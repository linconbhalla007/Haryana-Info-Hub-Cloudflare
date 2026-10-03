import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const primaryLinks = [
  { to: '/', label: 'मुख्य पृष्ठ', end: true },
  { to: '/government-orders', label: 'सरकारी आदेश एवं निर्देश' },
  { to: '/jobs', label: 'सरकारी भर्तियाँ एवं रोजगार जानकारी' },
];

const moreLinks = [
  { to: '/news', label: 'विभागीय परीक्षा संबंधित अध्ययन सामग्री' },
  { to: '/schemes', label: 'Treasury / e-Salary / HRMS संबंधित जानकारी' },
  { to: '/proforma-files', label: 'सरकारी कर्मचारियों के उपयोगी प्रोफॉर्मा एवं फाइलें' },
  { to: '/departments', label: 'विभाग' },
  { to: '/search', label: 'खोजें' },
];

function Navbar({ mobile = false, onNavigate, onDevClick }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  const devLinks = ['/news', '/schemes', '/departments', '/proforma-files'];

  useEffect(() => {
    function handleClickOutside(e) {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLinkClick = (e, link) => {
    if (devLinks.includes(link.to)) {
      e.preventDefault();
      if (onDevClick) {
        onDevClick(link.label);
      }
      if (onNavigate) {
        onNavigate();
      }
    } else {
      if (onNavigate) {
        onNavigate();
      }
    }
  };

  const navClass = mobile ? 'navbar navbar--mobile' : 'navbar';

  return (
    <nav className={navClass} aria-label="मुख्य नेविगेशन">
      {primaryLinks.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) =>
            'navbar__link' + (isActive ? ' navbar__link--active' : '')
          }
          onClick={(e) => handleLinkClick(e, link)}
        >
          {link.label}
        </NavLink>
      ))}

      {mobile ? (
        moreLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              'navbar__link' + (isActive ? ' navbar__link--active' : '')
            }
            onClick={(e) => handleLinkClick(e, link)}
          >
            {link.label}
          </NavLink>
        ))
      ) : (
        <div className="navbar__more" ref={moreRef}>
          <button
            type="button"
            className="navbar__link navbar__more-btn"
            onClick={() => setMoreOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={moreOpen}
          >
            अधिक <span className="navbar__caret">▾</span>
          </button>
          {moreOpen && (
            <div className="navbar__dropdown" role="menu">
              {moreLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className="navbar__dropdown-link"
                  role="menuitem"
                  onClick={(e) => {
                    setMoreOpen(false);
                    handleLinkClick(e, link);
                  }}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
