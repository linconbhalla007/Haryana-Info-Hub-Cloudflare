import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getGovernmentOrders } from '../services/publicGovernmentOrderService.js';
import EmptyState from '../components/EmptyState.jsx';
import ListToolbar from '../components/ListToolbar.jsx';
import './pages.css';
import './GovernmentOrders.css';

function GovernmentOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
  const currentPage = isNaN(pageFromUrl) || pageFromUrl < 1 ? 1 : pageFromUrl;

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    page: currentPage,
    limit: 15,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const ITEMS_PER_PAGE = 15;

  const fetchOrders = (pageToFetch) => {
    setLoading(true);
    setOrders([]); // Do not display old page data while loading newly requested page
    setError(null);

    getGovernmentOrders(pageToFetch, ITEMS_PER_PAGE)
      .then((res) => {
        setOrders(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load government orders.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > (pagination.totalPages || 1)) return;
    setSearchParams({ page: newPage });
  };

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        (o.title && o.title.toLowerCase().includes(q)) ||
        (o.department && o.department.toLowerCase().includes(q)) ||
        (o.departmentHindi && o.departmentHindi.toLowerCase().includes(q)) ||
        (o.description && o.description.toLowerCase().includes(q))
    );
  }, [query, orders]);

  const handleRetry = () => {
    fetchOrders(currentPage);
  };

  return (
    <>
      <div className="page-header">
        <div className="container">
          <span className="eyebrow">आधिकारिक दस्तावेज़</span>
          <h1 className="page-header__title">सरकारी आदेश एवं निर्देश</h1>
          <p className="page-header__desc">
            विभिन्न विभागों द्वारा जारी नए एवं पुराने सरकारी आदेश और निर्देश यहां देखें।
          </p>
        </div>
      </div>

      {loading ? (
        <div className="container page-body" style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div
            className="loading-spinner"
            style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: '3px solid rgba(255, 124, 0, 0.1)',
              borderTopColor: 'var(--saffron-500)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '16px',
            }}
          ></div>
          <p style={{ color: 'var(--text-500)', fontSize: '15px', fontWeight: 600 }}>
            दस्तावेज़ लोड हो रहे हैं... / Loading orders...
          </p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : error ? (
        <div className="container page-body">
          <EmptyState
            title="डेटा लोड करने में त्रुटि / Error Loading Data"
            message="सर्वर से नवीनतम सरकारी आदेश लोड नहीं किए जा सके। कृपया इंटरनेट कनेक्शन की जांच करें या पुनः प्रयास करें।"
          />
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button className="btn btn-outline" onClick={handleRetry}>
              पुनः प्रयास करें / Retry
            </button>
          </div>
        </div>
      ) : (
        <div className="container page-body">
          <ListToolbar
            value={query}
            onChange={setQuery}
            placeholder="आदेश खोजें..."
            count={filteredOrders.length}
          />

          {/* Small Summary */}
          <div style={{ marginBottom: '16px', fontSize: '13.5px', color: 'var(--text-500)', fontWeight: 600 }}>
            Showing page {pagination.page} of {pagination.totalPages} — {pagination.total} total government orders
          </div>

          {filteredOrders.length === 0 ? (
            <EmptyState message="अलग शब्दों से खोजने का प्रयास करें।" />
          ) : (
            <>
              <div className="orders-stack-layout">
                {filteredOrders.map((order) => (
                  <div className="order-row-card" key={order.id}>
                    <div className="order-row-card__meta">
                      <span className="order-row-card__date">{order.date}</span>
                    </div>
                    <div className="order-row-card__content">
                      <h3 className="order-row-card__title">
                        <Link to={`/government-orders/${order.id}`}>
                          {order.title}
                        </Link>
                      </h3>
                      <p className="order-row-card__desc">{order.description}</p>
                      <Link to={`/government-orders/${order.id}`} className="order-row-card__readmore-hint">
                        पूरा आदेश और PDF देखने के लिए यहाँ क्लिक करें →
                      </Link>
                    </div>
                    <div className="order-row-card__actions">
                      <Link
                        to={`/government-orders/${order.id}`}
                        className="btn btn-outline btn-sm"
                      >
                        विवरण देखें
                      </Link>
                      {order.pdf && (
                        <a
                          href={order.pdf}
                          download
                          className="btn btn-green btn-sm"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          PDF डाउनलोड करें
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Server-Side Pagination Controls */}
              <div className="pagination" style={{ marginTop: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <button
                  className="pagination__btn"
                  disabled={!pagination.hasPreviousPage || loading}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  ← Previous
                </button>

                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy-800)' }}>
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  className="pagination__btn"
                  disabled={!pagination.hasNextPage || loading}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

export default GovernmentOrders;
