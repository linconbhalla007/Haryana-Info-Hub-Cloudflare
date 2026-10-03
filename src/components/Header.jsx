import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo.jsx';
import Navbar from './Navbar.jsx';
import SearchBar from './SearchBar.jsx';
import './Header.css';

function Header({ onDevClick }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Prevent background scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <header className="site-header">
        <div className="container site-header__inner">
          <Link to="/" className="site-header__brand" aria-label="Haryana Info Hub — मुख्य पृष्ठ">
            <Logo variant="header" />
          </Link>
 
          <div className="site-header__nav-desktop">
            <Navbar onDevClick={onDevClick} />
          </div>
 
          <div className="site-header__actions">
            <div className="site-header__search-desktop">
              <SearchBar variant="desktop" />
            </div>
            <div className="site-header__search-mobile">
              <SearchBar variant="mobile" />
            </div>
            <button
              type="button"
              className={`hamburger ${menuOpen ? 'hamburger--open' : ''}`}
              aria-label={menuOpen ? 'मेनू बंद करें' : 'मेनू खोलें'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
        <div className="tricolor-strip" />
      </header>
 
      {/* Mobile slide-down menu */}
      <div className={`mobile-menu ${menuOpen ? 'mobile-menu--open' : ''}`}>
        <div className="container mobile-menu__inner">
          <Navbar mobile onNavigate={() => setMenuOpen(false)} onDevClick={onDevClick} />
        </div>
      </div>
      {menuOpen && (
        <div className="mobile-menu__backdrop" onClick={() => setMenuOpen(false)} />
      )}
    </>
  );
}

export default Header;
