import React, { useEffect } from 'react';

function ToastNotification({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div className="admin-toast-container">
      <div className={`admin-toast ${isSuccess ? 'admin-toast--success' : 'admin-toast--error'}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isSuccess ? '#22c55e' : '#ef4444'} strokeWidth="2">
          {isSuccess ? (
            <polyline points="20 6 9 17 4 12" />
          ) : (
            <>
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </>
          )}
        </svg>
        <div style={{ flex: 1 }}>{toast.message}</div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
          aria-label="Close Toast"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default ToastNotification;
