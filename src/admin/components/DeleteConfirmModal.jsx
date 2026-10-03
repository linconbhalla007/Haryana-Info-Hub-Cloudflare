import React from 'react';

function DeleteConfirmModal({ isOpen, order, onConfirm, onClose, loading }) {
  if (!isOpen || !order) return null;

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal admin-modal--sm" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal__header">
          <h3 className="admin-modal__title" style={{ color: '#dc2626' }}>
            Delete Government Order
          </h3>
          <button className="admin-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="admin-modal__body">
          <p style={{ margin: '0 0 12px', fontSize: '15px' }}>
            Are you sure you want to delete this government order?
          </p>
          <div
            style={{
              background: '#f8fafc',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            {order.title}
          </div>
          <p style={{ margin: '12px 0 0', fontSize: '12.5px', color: '#64748b' }}>
            This action cannot be undone.
          </p>
        </div>

        <div className="admin-modal__footer">
          <button className="btn btn-outline btn-sm" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="btn btn-sm"
            style={{ background: '#dc2626', color: '#fff', border: 'none' }}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <span className="admin-spinner" style={{ width: 14, height: 14 }} /> : 'Delete Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;
