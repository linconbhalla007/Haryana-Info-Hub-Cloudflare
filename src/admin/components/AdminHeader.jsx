import React from 'react';
import { useLocation, Link } from 'react-router-dom';

function AdminHeader({ onToggleSidebar }) {
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/admin/dashboard':
        return 'Dashboard Overview';
      case '/admin/government-orders':
        return 'Government Orders CMS';
      default:
        return 'Admin Portal';
    }
  };

  return (
    <header className="admin-header">
      <div className="admin-header__left">
        <button
          className="admin-header__toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 className="admin-header__title">{getPageTitle()}</h1>
      </div>

      <div className="admin-header__right">
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="admin-btn-action"
          title="View Live Public Website"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          <span>View Public Site</span>
        </Link>
      </div>
    </header>
  );
}

export default AdminHeader;
