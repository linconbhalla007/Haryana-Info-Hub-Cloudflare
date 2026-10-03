import React from 'react';

function GovernmentOrderView({ isOpen, order, onClose }) {
  if (!isOpen || !order) return null;

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal admin-modal--lg" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal__header">
          <h3 className="admin-modal__title">Government Order Details</h3>
          <button className="admin-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="admin-modal__body">
          <div style={{ marginBottom: '24px' }}>
            <span className="eyebrow" style={{ fontSize: '11px' }}>
              Order Details
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#151821', margin: '4px 0 0' }}>
              {order.title}
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              background: '#f8fafc',
              padding: '16px 20px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              marginBottom: '24px',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>ORDER ID</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{order.id}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>ORDER NUMBER</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{order.orderNumber}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>DATE</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{order.date}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>DEPARTMENT</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                {order.departmentHindi || order.department}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 8px', color: '#334155' }}>
              Description
            </h4>
            <p style={{ fontSize: '14.5px', lineHeight: 1.6, color: '#334155', background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', margin: 0 }}>
              {order.description || 'No description provided.'}
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 8px', color: '#334155' }}>
              Attached PDF Document
            </h4>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                gap: '12px',
              }}
            >
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13.5px', color: '#64748b' }}>
                📄 {order.pdf || 'No PDF URL linked'}
              </div>
              {order.pdf && (
                <a
                  href={order.pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-green btn-sm"
                  style={{ textDecoration: 'none', flexShrink: 0 }}
                >
                  View PDF ↗
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="admin-modal__footer">
          <button className="btn btn-outline btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default GovernmentOrderView;
