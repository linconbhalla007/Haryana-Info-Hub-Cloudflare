import React from 'react';
import { useParams, Link } from 'react-router-dom';
import schemes from '../data/schemes.js';
import Breadcrumb from '../components/Breadcrumb.jsx';
import EmptyState from '../components/EmptyState.jsx';
import './pages.css';

function SchemeDetail() {
  const { id } = useParams();
  const scheme = schemes.find((s) => s.id === id);

  if (!scheme) {
    return (
      <div className="container page-body">
        <EmptyState title="योजना नहीं मिली" message="यह योजना उपलब्ध नहीं है या हटा दी गई है।" />
        <div style={{ textAlign: 'center' }}>
          <Link to="/schemes" className="btn btn-outline">
            सभी योजनाएं देखें
          </Link>
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
              { label: 'योजनाएं', to: '/schemes' },
              { label: scheme.name },
            ]}
          />
          <span className="eyebrow detail-hero__eyebrow">सरकारी योजना</span>
          <h1 className="detail-hero__title">{scheme.name}</h1>
        </div>
      </div>

      <div className="container page-body">
        <div className="detail-meta">
          <div className="detail-meta__item">
            <span className="detail-meta__label">विभाग</span>
            <span className="detail-meta__value">{scheme.departmentHindi}</span>
          </div>
        </div>

        <div className="detail-two-col">
          <div className="detail-section">
            <h2>विवरण</h2>
            <p>{scheme.description}</p>
          </div>
          <div className="detail-section">
            <h2>पात्रता</h2>
            <p>{scheme.eligibility}</p>
          </div>
          <div className="detail-section">
            <h2>महत्वपूर्ण जानकारी</h2>
            <p>{scheme.importantInfo}</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default SchemeDetail;
