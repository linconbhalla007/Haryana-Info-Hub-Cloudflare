import React, { useState, useEffect } from 'react';
import { createHomepageSection, updateHomepageSection } from '../services/adminApi.js';

const TYPE_OPTIONS = [
  { label: 'CTA Banner / Help CTA', value: 'cta' },
  { label: 'Banner Announcement', value: 'banner' },
  { label: 'Feature Card', value: 'card' },
  { label: 'Notice / Alert', value: 'notice' },
  { label: 'General Announcement', value: 'announcement' },
];

const SAMPLE_TEMPLATES = {
  cta: {
    title: 'निःशुल्क सहायता / Assistance',
    message: 'PensionCase, Dependent Family Pension Case एवं NPS Case व Medical Reimbursement File बनवाने के लिए संपर्क करें',
    whatsappNumber: '919812343583',
    whatsappMessage: 'Hello, mujhe help chahiye.',
    buttonText: 'WhatsApp पर सहायता लें',
  },
  banner: {
    title: 'Haryana Govt Updates',
    message: 'Important notification for all Haryana State employees.',
    linkUrl: '/government-orders',
    buttonText: 'Read More',
  },
  notice: {
    title: 'System Notice',
    message: 'Maintenance window scheduled.',
    urgency: 'high',
  },
};

function formatDateForInput(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    // Formats date to YYYY-MM-DDTHH:mm in local time
    const pad = (n) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return '';
  }
}

function parseInputDateToISO(inputVal) {
  if (!inputVal || !inputVal.trim()) return null;
  try {
    const d = new Date(inputVal);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

function HomepageSectionForm({ isOpen, onClose, onSuccess, section }) {
  const isEdit = Boolean(section && section.key);

  const [key, setKey] = useState('');
  const [type, setType] = useState('cta');
  const [enabled, setEnabled] = useState(true);
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [displayOrder, setDisplayOrder] = useState(1);
  const [configText, setConfigText] = useState('{}');

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormError('');
      setIsSubmitting(false);

      if (section) {
        setKey(section.key || '');
        setType(section.type || 'cta');
        setEnabled(section.enabled !== false);
        setStartAt(formatDateForInput(section.startAt));
        setEndAt(formatDateForInput(section.endAt));
        setDisplayOrder(typeof section.displayOrder === 'number' ? section.displayOrder : 1);

        const configObj = section.config || {};
        setConfigText(JSON.stringify(configObj, null, 2));
      } else {
        setKey('');
        setType('cta');
        setEnabled(true);
        setStartAt('');
        setEndAt('');
        setDisplayOrder(1);
        setConfigText(JSON.stringify(SAMPLE_TEMPLATES.cta, null, 2));
      }
    }
  }, [isOpen, section]);

  if (!isOpen) return null;

  const handleTemplateLoad = (templateType) => {
    const sample = SAMPLE_TEMPLATES[templateType] || {};
    setConfigText(JSON.stringify(sample, null, 2));
    setType(templateType);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedKey = key.trim();
    if (!trimmedKey) {
      setFormError('Section Key is required.');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedKey)) {
      setFormError('Section Key can only contain letters, numbers, underscores (_), and hyphens (-).');
      return;
    }

    let parsedConfig = {};
    if (configText.trim()) {
      try {
        parsedConfig = JSON.parse(configText);
        if (typeof parsedConfig !== 'object' || parsedConfig === null || Array.isArray(parsedConfig)) {
          setFormError('Config must be a valid JSON Object (e.g. { "title": "..." }).');
          return;
        }
      } catch (err) {
        setFormError(`Invalid JSON in Config field: ${err.message}`);
        return;
      }
    }

    const payload = {
      type: type.trim() || 'cta',
      enabled: Boolean(enabled),
      startAt: parseInputDateToISO(startAt),
      endAt: parseInputDateToISO(endAt),
      displayOrder: Number(displayOrder) || 1,
      config: parsedConfig,
    };

    if (!isEdit) {
      payload.key = trimmedKey;
    }

    setIsSubmitting(true);

    try {
      if (isEdit) {
        await updateHomepageSection(section.key, payload);
        onSuccess(`Homepage section "${section.key}" updated successfully.`);
      } else {
        await createHomepageSection(payload);
        onSuccess(`Homepage section "${trimmedKey}" created successfully.`);
      }
      onClose();
    } catch (err) {
      setFormError(err.message || 'Failed to save homepage section. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div
        className="admin-modal admin-modal--lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="admin-modal__header">
          <h2 className="admin-modal__title">
            {isEdit ? `Edit Section: ${section?.key}` : 'Create Homepage Section'}
          </h2>
          <button
            className="admin-modal__close"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="admin-modal__body" style={{ overflowY: 'auto' }}>
            {formError && (
              <div className="admin-alert-error" style={{ marginBottom: '20px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{formError}</span>
              </div>
            )}

            <div className="admin-form-grid">
              {/* Key Field */}
              <div className="admin-field-group">
                <label htmlFor="section-key">
                  Section Key <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="section-key"
                  type="text"
                  className="admin-input"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="e.g. whatsapp_pension_help"
                  disabled={isEdit || isSubmitting}
                  style={isEdit ? { background: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' } : {}}
                  required
                />
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {isEdit ? 'Key cannot be modified after creation.' : 'Unique identifier (letters, numbers, _, -)'}
                </span>
              </div>

              {/* Type Field */}
              <div className="admin-field-group">
                <label htmlFor="section-type">
                  Section Type <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  id="section-type"
                  className="admin-select"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  disabled={isSubmitting}
                  required
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} ({opt.value})
                    </option>
                  ))}
                </select>
              </div>

              {/* Display Order */}
              <div className="admin-field-group">
                <label htmlFor="section-order">
                  Display Order <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="section-order"
                  type="number"
                  className="admin-input"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  placeholder="1"
                  min="1"
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Enabled Switch */}
              <div className="admin-field-group" style={{ justifyContent: 'center' }}>
                <label style={{ marginBottom: '8px' }}>Enabled Status</label>
                <label className="admin-toggle-switch">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    disabled={isSubmitting}
                  />
                  <span className="admin-toggle-switch__slider"></span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: enabled ? '#047857' : '#64748b' }}>
                    {enabled ? 'Enabled (Active)' : 'Disabled'}
                  </span>
                </label>
              </div>

              {/* Start Date (Optional) */}
              <div className="admin-field-group">
                <label htmlFor="section-start">Start Date & Time (Optional)</label>
                <input
                  id="section-start"
                  type="datetime-local"
                  className="admin-input"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  disabled={isSubmitting}
                />
                <span style={{ fontSize: '12px', color: '#64748b' }}>Leave blank for immediate start</span>
              </div>

              {/* End Date (Optional) */}
              <div className="admin-field-group">
                <label htmlFor="section-end">End Date & Time (Optional)</label>
                <input
                  id="section-end"
                  type="datetime-local"
                  className="admin-input"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  disabled={isSubmitting}
                />
                <span style={{ fontSize: '12px', color: '#64748b' }}>Leave blank for no expiration</span>
              </div>

              {/* Config JSON Object (Full Width) */}
              <div className="admin-field-group admin-form-grid--full">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label htmlFor="section-config" style={{ margin: 0 }}>
                    Config Object (JSON) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', alignSelf: 'center', marginRight: '4px' }}>
                      Load Sample:
                    </span>
                    <button
                      type="button"
                      className="admin-btn-action"
                      onClick={() => handleTemplateLoad('cta')}
                      style={{ fontSize: '11px', padding: '3px 8px' }}
                    >
                      CTA
                    </button>
                    <button
                      type="button"
                      className="admin-btn-action"
                      onClick={() => handleTemplateLoad('banner')}
                      style={{ fontSize: '11px', padding: '3px 8px' }}
                    >
                      Banner
                    </button>
                    <button
                      type="button"
                      className="admin-btn-action"
                      onClick={() => handleTemplateLoad('notice')}
                      style={{ fontSize: '11px', padding: '3px 8px' }}
                    >
                      Notice
                    </button>
                  </div>
                </div>
                <textarea
                  id="section-config"
                  className="admin-input admin-textarea--code"
                  rows={8}
                  value={configText}
                  onChange={(e) => setConfigText(e.target.value)}
                  placeholder={`{\n  "title": "Header Title",\n  "message": "Content body message"\n}`}
                  disabled={isSubmitting}
                  required
                />
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Valid JSON object containing title, message, whatsappNumber, buttonText, etc.
                </span>
              </div>
            </div>
          </div>

          <div className="admin-modal__footer">
            <button
              type="button"
              className="admin-btn-action"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-sidebar__nav-item active"
              style={{ border: 'none', cursor: 'pointer', padding: '10px 24px' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="admin-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                  Saving...
                </span>
              ) : isEdit ? (
                'Update Section'
              ) : (
                'Create Section'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default HomepageSectionForm;
