import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchAll, getTotalResultCount } from '../services/searchService.js';
import { getAllGovernmentOrders } from '../services/publicGovernmentOrderService.js';
import GovernmentOrderCard from '../components/GovernmentOrderCard.jsx';
import JobCard from '../components/JobCard.jsx';
import NewsCard from '../components/NewsCard.jsx';
import SchemeCard from '../components/SchemeCard.jsx';
import DepartmentCard from '../components/DepartmentCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import './pages.css';
import './Search.css';

const categoryLabels = {
  governmentOrders: 'सरकारी आदेश',
  jobs: 'नौकरियां',
  news: 'ताज़ा खबरें',
  schemes: 'योजनाएं',
  departments: 'विभाग',
};

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(initialQuery);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Keep the input in sync if the URL's ?q= changes from elsewhere
  useEffect(() => {
    setInputValue(initialQuery);
  }, [initialQuery]);

  // Load government orders for search capability
  useEffect(() => {
    let active = true;
    getAllGovernmentOrders()
      .then((data) => {
        if (active) {
          setOrders(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Failed to load orders");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const results = useMemo(() => {
    if (loading || error) {
      return { governmentOrders: [], jobs: [], news: [], schemes: [], departments: [] };
    }
    return searchAll(initialQuery, orders);
  }, [initialQuery, orders, loading, error]);

  const total = useMemo(() => getTotalResultCount(results), [results]);

  function handleSubmit(e) {
    e.preventDefault();
    const q = inputValue.trim();
    setSearchParams(q ? { q } : {});
  }

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    getAllGovernmentOrders()
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load orders");
        setLoading(false);
      });
  };

  return (
    <>
      <div className="page-header">
        <div className="container">
          <span className="eyebrow">खोजें</span>
          <h1 className="page-header__title">हरियाणा जानकारी खोजें</h1>
          <p className="page-header__desc">
            सरकारी आदेश, नौकरियां, योजनाएं, विभाग और खबरों में एक साथ खोजें।
          </p>

          <form className="search-page-form" onSubmit={handleSubmit}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="जैसे: शिक्षा, स्वास्थ्य, भर्ती..."
              aria-label="खोजें"
              autoFocus
            />
            <button type="submit" className="btn btn-primary">
              खोजें
            </button>
          </form>
        </div>
      </div>

      <div className="container page-body">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="loading-spinner" style={{
              display: 'inline-block',
              width: '35px',
              height: '35px',
              border: '3px solid rgba(255, 124, 0, 0.1)',
              borderTopColor: 'var(--saffron-500)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '14px'
            }}></div>
            <p style={{ color: 'var(--text-500)', fontSize: '14px' }}>खोज इंजन तैयार हो रहा है... / Preparing search engine...</p>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : error ? (
          <div>
            <EmptyState
              title="खोज सेवा लोड करने में असमर्थ"
              message="सर्वर से डेटा लोड करने में समस्या हुई। कृपया इंटरनेट कनेक्शन जांचें।"
            />
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button className="btn btn-outline" onClick={handleRetry}>
                पुनः प्रयास करें / Retry
              </button>
            </div>
          </div>
        ) : !initialQuery.trim() ? (
          <EmptyState
            title="खोजना शुरू करें"
            message="ऊपर दिए गए बॉक्स में कोई शब्द टाइप करें, जैसे 'शिक्षा' या 'भर्ती'।"
          />
        ) : total === 0 ? (
          <EmptyState
            title={`"${initialQuery}" के लिए कोई परिणाम नहीं मिला`}
            message="कृपया अलग शब्दों से पुनः खोजने का प्रयास करें।"
          />
        ) : (
          <>
            <div className="search-summary">
              <strong>"{initialQuery}"</strong> के लिए {total} परिणाम मिले
            </div>

            <div className="search-chip-row">
              {Object.entries(results).map(([key, items]) =>
                items.length > 0 ? (
                  <span key={key} className="search-chip">
                    {categoryLabels[key]} ({items.length})
                  </span>
                ) : null
              )}
            </div>

            {results.governmentOrders.length > 0 && (
              <ResultGroup title="सरकारी आदेश" viewAllTo="/government-orders">
                <div className="grid">
                  {results.governmentOrders.map((o) => (
                    <GovernmentOrderCard key={o.id} order={o} />
                  ))}
                </div>
              </ResultGroup>
            )}

            {results.jobs.length > 0 && (
              <ResultGroup title="नौकरियां" viewAllTo="/jobs">
                <div className="grid">
                  {results.jobs.map((j) => (
                    <JobCard key={j.id} job={j} />
                  ))}
                </div>
              </ResultGroup>
            )}

            {results.schemes.length > 0 && (
              <ResultGroup title="योजनाएं" viewAllTo="/schemes">
                <div className="grid">
                  {results.schemes.map((s) => (
                    <SchemeCard key={s.id} scheme={s} />
                  ))}
                </div>
              </ResultGroup>
            )}

            {results.news.length > 0 && (
              <ResultGroup title="ताज़ा खबरें" viewAllTo="/news">
                <div className="grid">
                  {results.news.map((n) => (
                    <NewsCard key={n.id} item={n} />
                  ))}
                </div>
              </ResultGroup>
            )}

            {results.departments.length > 0 && (
              <ResultGroup title="विभाग" viewAllTo="/departments">
                <div className="grid dept-grid">
                  {results.departments.map((d) => (
                    <DepartmentCard key={d.id} department={d} />
                  ))}
                </div>
              </ResultGroup>
            )}
          </>
        )}
      </div>
    </>
  );
}

function ResultGroup({ title, viewAllTo, children }) {
  return (
    <div className="search-group">
      <div className="section-head">
        <h2 className="section-title" style={{ fontSize: 19 }}>
          {title}
        </h2>
        <Link to={viewAllTo} className="home-latest__more">
          सभी देखें →
        </Link>
      </div>
      {children}
    </div>
  );
}

export default Search;
