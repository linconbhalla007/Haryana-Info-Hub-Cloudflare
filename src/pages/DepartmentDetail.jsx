import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import departments from '../data/departments.js';
import jobs from '../data/jobs.js';
import { getAllGovernmentOrders } from '../services/publicGovernmentOrderService.js';
import Breadcrumb from '../components/Breadcrumb.jsx';
import EmptyState from '../components/EmptyState.jsx';
import GovernmentOrderCard from '../components/GovernmentOrderCard.jsx';
import JobCard from '../components/JobCard.jsx';
import './pages.css';

function DepartmentDetail() {
  const { id } = useParams();
  const department = departments.find((d) => d.id === id);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          setError(err.message || "Failed to load government orders");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    getAllGovernmentOrders()
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load government orders");
        setLoading(false);
      });
  };

  if (!department) {
    return (
      <div className="container page-body">
        <EmptyState title="विभाग नहीं मिला" message="यह विभाग उपलब्ध नहीं है।" />
        <div style={{ textAlign: 'center' }}>
          <Link to="/departments" className="btn btn-outline">
            सभी विभाग देखें
          </Link>
        </div>
      </div>
    );
  }

  const relatedOrders = orders.filter(
    (o) => o.department === department.name
  );
  const relatedJobs = jobs.filter((j) => j.department === department.name);

  return (
    <>
      <div className="detail-hero">
        <div className="container">
          <Breadcrumb
            items={[
              { label: 'मुख्य पृष्ठ', to: '/' },
              { label: 'विभाग', to: '/departments' },
              { label: department.nameHindi },
            ]}
          />
          <span className="eyebrow detail-hero__eyebrow">विभाग</span>
          <h1 className="detail-hero__title">{department.nameHindi}</h1>
        </div>
      </div>

      <div className="container page-body">
        <div className="detail-section" style={{ maxWidth: 760 }}>
          <p>{department.description}</p>
        </div>

        {loading ? (
          <div className="detail-section" style={{ textAlign: 'center', padding: '40px 0' }}>
            <div className="loading-spinner" style={{
              display: 'inline-block',
              width: '30px',
              height: '30px',
              border: '3px solid rgba(255, 124, 0, 0.1)',
              borderTopColor: 'var(--saffron-500)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '12px'
            }}></div>
            <p style={{ color: 'var(--text-500)', fontSize: '14px' }}>आदेश लोड हो रहे हैं... / Loading orders...</p>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : error ? (
          <div className="detail-section">
            <h2>संबंधित सरकारी आदेश</h2>
            <EmptyState 
              title="डेटा लोड करने में त्रुटि" 
              message="विभाग से संबंधित आदेश लोड नहीं किए जा सके।"
            />
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <button className="btn btn-outline btn-sm" onClick={handleRetry}>
                पुनः प्रयास करें / Retry
              </button>
            </div>
          </div>
        ) : (
          relatedOrders.length > 0 && (
            <div className="detail-section">
              <h2>संबंधित सरकारी आदेश</h2>
              <div className="grid">
                {relatedOrders.map((o) => (
                  <GovernmentOrderCard key={o.id} order={o} />
                ))}
              </div>
            </div>
          )
        )}

        {relatedJobs.length > 0 && (
          <div className="detail-section">
            <h2>संबंधित भर्तियां</h2>
            <div className="grid">
              {relatedJobs.map((j) => (
                <JobCard key={j.id} job={j} />
              ))}
            </div>
          </div>
        )}

        {!loading && !error && relatedOrders.length === 0 && relatedJobs.length === 0 && (
          <EmptyState
            title="अभी कोई अपडेट उपलब्ध नहीं है"
            message="इस विभाग से संबंधित आदेश या भर्तियां जल्द जोड़ी जाएंगी।"
          />
        )}
      </div>
    </>
  );
}

export default DepartmentDetail;
