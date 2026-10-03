import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../components/AdminLayout.jsx';
import HomepageSectionForm from '../components/HomepageSectionForm.jsx';
import ToastNotification from '../components/ToastNotification.jsx';
import {
  getHomepageSections,
  toggleHomepageSectionEnabled,
} from '../services/adminApi.js';

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return null;
  }
}

function StatusBadge({ status }) {
  const normalizedStatus = (status || 'DISABLED').toUpperCase();

  let badgeClass = 'admin-status-badge--disabled';
  let label = normalizedStatus;

  if (normalizedStatus === 'ACTIVE') {
    badgeClass = 'admin-status-badge--active';
    label = '● Active';
  } else if (normalizedStatus === 'SCHEDULED') {
    badgeClass = 'admin-status-badge--scheduled';
    label = '⏳ Scheduled';
  } else if (normalizedStatus === 'DISABLED') {
    badgeClass = 'admin-status-badge--disabled';
    label = '○ Disabled';
  } else if (normalizedStatus === 'EXPIRED') {
    badgeClass = 'admin-status-badge--expired';
    label = '✕ Expired';
  }

  return <span className={`admin-status-badge ${badgeClass}`}>{label}</span>;
}

function HomepageSectionsCMS() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Form Modal & Action States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [togglingKeys, setTogglingKeys] = useState(new Set());
  const [toast, setToast] = useState(null);

  const fetchSections = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getHomepageSections();
      setSections(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load homepage sections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  // Filtered & Searched Sections
  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sections.filter((s) => {
      const matchesType = selectedType === 'ALL' || s.type === selectedType;
      const matchesStatus =
        selectedStatus === 'ALL' ||
        (s.status || '').toUpperCase() === selectedStatus;

      if (!matchesType || !matchesStatus) return false;
      if (!q) return true;

      const title = s.config?.title || s.config?.heading || '';

      return (
        (s.key && s.key.toLowerCase().includes(q)) ||
        (s.type && s.type.toLowerCase().includes(q)) ||
        title.toLowerCase().includes(q)
      );
    });
  }, [sections, searchQuery, selectedType, selectedStatus]);

  // Handle Toggle Enable/Disable
  const handleToggleEnabled = async (section) => {
    const key = section.key;
    const newEnabledState = !section.enabled;

    setTogglingKeys((prev) => new Set(prev).add(key));

    try {
      await toggleHomepageSectionEnabled(key, newEnabledState);
      setToast({
        type: 'success',
        message: `Section "${key}" ${newEnabledState ? 'enabled' : 'disabled'} successfully.`,
      });
      // Refresh list to fetch updated dynamic status
      fetchSections();
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message || `Failed to update status for "${key}".`,
      });
    } finally {
      setTogglingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const handleOpenCreate = () => {
    setSelectedSection(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (section) => {
    setSelectedSection(section);
    setIsFormOpen(true);
  };

  const handleFormSuccess = (message) => {
    setToast({ type: 'success', message });
    fetchSections();
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div className="admin-page-header__info">
          <h1>Homepage Sections</h1>
          <p>Manage home page CTA banners, notices, and promotional cards</p>
        </div>
        <button
          className="admin-sidebar__nav-item active"
          onClick={handleOpenCreate}
          style={{ border: 'none', cursor: 'pointer', padding: '10px 18px', gap: '8px' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Create Homepage Section</span>
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-card__header">
          <h2 className="admin-card__title">
            All Sections ({filteredSections.length})
          </h2>

          <div className="admin-filters-bar">
            {/* Search Input */}
            <div className="admin-search-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="admin-input"
                placeholder="Search key, type, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Type Filter */}
            <select
              className="admin-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="cta">CTA Banners</option>
              <option value="banner">Banners</option>
              <option value="card">Cards</option>
              <option value="notice">Notices</option>
              <option value="announcement">Announcements</option>
            </select>

            {/* Status Filter */}
            <select
              className="admin-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="DISABLED">Disabled</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="admin-loading-screen" style={{ minHeight: '300px' }}>
            <span className="admin-spinner" />
            <p>Loading homepage sections...</p>
          </div>
        ) : error ? (
          /* Error State */
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div className="admin-alert-error" style={{ display: 'inline-flex', maxWidth: '500px' }}>
              <span>{error}</span>
            </div>
            <div style={{ marginTop: '16px' }}>
              <button className="admin-btn-action" onClick={fetchSections}>
                Try Again
              </button>
            </div>
          </div>
        ) : filteredSections.length === 0 ? (
          /* Empty State */
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#64748b' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 16px', opacity: 0.5 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            <h3 style={{ fontSize: '16px', color: '#0f172a', margin: '0 0 6px' }}>
              No Homepage Sections Found
            </h3>
            <p style={{ fontSize: '14px', margin: '0 0 20px' }}>
              {searchQuery || selectedType !== 'ALL' || selectedStatus !== 'ALL'
                ? 'No sections match your search filters.'
                : 'No homepage sections have been created yet.'}
            </p>
            {!(searchQuery || selectedType !== 'ALL' || selectedStatus !== 'ALL') && (
              <button className="admin-btn-action" onClick={handleOpenCreate}>
                + Create First Section
              </button>
            )}
          </div>
        ) : (
          /* Data Table */
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '60px', textAlign: 'center' }}>Order</th>
                  <th>Key</th>
                  <th>Type</th>
                  <th>Title</th>
                  <th style={{ textAlign: 'center' }}>Enabled</th>
                  <th>Dynamic Status</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Updated</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSections.map((sec) => {
                  const title = sec.config?.title || sec.config?.heading || '-';
                  const formattedStart = formatDate(sec.startAt);
                  const formattedEnd = formatDate(sec.endAt);
                  const formattedUpdated = formatDate(sec.updatedAt);
                  const isToggling = togglingKeys.has(sec.key);

                  return (
                    <tr key={sec._id || sec.key}>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#64748b' }}>
                        {sec.displayOrder ?? 1}
                      </td>

                      <td>
                        <span className="admin-code-key">{sec.key}</span>
                      </td>

                      <td>
                        <span className="admin-type-badge">{sec.type || 'cta'}</span>
                      </td>

                      <td>
                        <div className="admin-table__title" style={{ maxWidth: '240px' }}>
                          {title}
                        </div>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <label className="admin-toggle-switch" title={sec.enabled ? 'Click to Disable' : 'Click to Enable'}>
                          <input
                            type="checkbox"
                            checked={Boolean(sec.enabled)}
                            onChange={() => handleToggleEnabled(sec)}
                            disabled={isToggling}
                          />
                          <span className="admin-toggle-switch__slider" />
                        </label>
                      </td>

                      <td>
                        <StatusBadge status={sec.status} />
                      </td>

                      <td style={{ fontSize: '13px', color: sec.startAt ? '#334155' : '#94a3b8' }}>
                        {formattedStart || 'Immediate'}
                      </td>

                      <td style={{ fontSize: '13px', color: sec.endAt ? '#334155' : '#94a3b8' }}>
                        {formattedEnd || 'No Expiry'}
                      </td>

                      <td style={{ fontSize: '12.5px', color: '#64748b' }}>
                        {formattedUpdated || '-'}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div className="admin-table__actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="admin-btn-action"
                            onClick={() => handleOpenEdit(sec)}
                            title="Edit Homepage Section"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            <span>Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal (Create / Edit) */}
      <HomepageSectionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
        section={selectedSection}
      />

      {/* Toast Notification */}
      {toast && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </AdminLayout>
  );
}

export default HomepageSectionsCMS;
