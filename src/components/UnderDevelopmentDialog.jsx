import React, { useEffect } from 'react';
import './UnderDevelopmentDialog.css';

function UnderDevelopmentDialog({ isOpen, onClose, cardTitle }) {
  // Handle escape key press to close dialog
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="dev-dialog-overlay" onClick={onClose}>
      <div 
        className="dev-dialog-container" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        {/* Tricolor accent bar inside the modal */}
        <div className="dev-dialog-accent" />
        
        <button className="dev-dialog-close-btn" onClick={onClose} aria-label="Close dialog">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="dev-dialog-content">
          <div className="dev-dialog-icon-wrapper">
            <svg className="dev-dialog-gear-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </div>

          <h2 id="dialog-title" className="dev-dialog-title">
            {cardTitle}: <span className="dev-dialog-orange-text">कार्य प्रगति पर है</span>
          </h2>
          <div className="dev-dialog-title-english">Under Development</div>
          
          <div className="dev-dialog-divider" />

          <div className="dev-dialog-body-hindi">
            यह सुविधा वर्तमान में विकसित की जा रही है और जल्द ही उपलब्ध होगी।
            <br />
            <strong className="dev-dialog-status-text">
              अभी वेबसाइट पर केवल 'सरकारी आदेश' (Government Orders) और 'नौकरियां / भर्ती' (Jobs) की सेवाएं ही सक्रिय हैं।
            </strong>
          </div>

          <div className="dev-dialog-body-english">
            This section is currently under construction and will be launched soon. 
            <br />
            <span>
              At present, only <strong>Government Orders</strong> and <strong>Jobs / Recruitments</strong> services are fully functional.
            </span>
          </div>

          <button className="dev-dialog-btn" onClick={onClose}>
            ठीक है / OK
          </button>
        </div>
      </div>
    </div>
  );
}

export default UnderDevelopmentDialog;
