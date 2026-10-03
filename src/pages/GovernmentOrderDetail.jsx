import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getGovernmentOrderById } from '../services/publicGovernmentOrderService.js';
import Breadcrumb from '../components/Breadcrumb.jsx';
import PDFViewer from '../components/PDFViewer.jsx';
import EmptyState from '../components/EmptyState.jsx';
import './pages.css';

function GovernmentOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    getGovernmentOrderById(id)
      .then((data) => {
        if (active) {
          setOrder(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Failed to load order details");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [id]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    getGovernmentOrderById(id)
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load order details");
        setLoading(false);
      });
  };

  if (loading) {
    return (
      <div className="container page-body" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div className="loading-spinner" style={{
          display: 'inline-block',
          width: '40px',
          height: '40px',
          border: '3px solid rgba(255, 124, 0, 0.1)',
          borderTopColor: 'var(--saffron-500)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }}></div>
        <p style={{ color: 'var(--text-500)', fontSize: '15px', fontWeight: 600 }}>विवरण लोड हो रहा है... / Loading details...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container page-body">
        <EmptyState
          title="आदेश नहीं मिला / Order Not Found"
          message="यह आदेश उपलब्ध नहीं है, हटा दिया गया है या सर्वर से लोड नहीं किया जा सका।"
        />
        <div style={{ textAlign: 'center', marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <Link to="/government-orders" className="btn btn-outline">
            सभी आदेश देखें / View All
          </Link>
          {error && (
            <button className="btn btn-outline" onClick={handleRetry}>
              पुनः प्रयास करें / Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="detail-hero">
        <div className="container">
          <Breadcrumb
            items={[
              { label: 'मुख्य पृष्ठ', to: '/' },
              { label: 'सरकारी आदेश', to: '/government-orders' },
              { label: order.title },
            ]}
          />
          <span className="eyebrow detail-hero__eyebrow">सरकारी आदेश</span>
          <h1 className="detail-hero__title">{order.title}</h1>
        </div>
      </div>

      <div className="container page-body">
        <div className="detail-meta">
          <div className="detail-meta__item">
            <span className="detail-meta__label">दिनांक</span>
            <span className="detail-meta__value">{order.date}</span>
          </div>
          <div className="detail-meta__item">
            <span className="detail-meta__label">आदेश संख्या</span>
            <span className="detail-meta__value">{order.orderNumber}</span>
          </div>
        </div>

        <div className="detail-two-col">
          <div className="detail-section">
            <h2>विवरण</h2>
            <p>{order.description}</p>
          </div>

          <div className="detail-section">
            <h2>PDF दस्तावेज़</h2>
            <PDFViewer src={order.pdf} title={order.title} />
          </div>
        </div>
      </div>
    </>
  );
}

export default GovernmentOrderDetail;
