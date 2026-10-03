import React from 'react';
import { useParams, Link } from 'react-router-dom';
import jobs from '../data/jobs.js';
import Breadcrumb from '../components/Breadcrumb.jsx';
import PDFViewer from '../components/PDFViewer.jsx';
import EmptyState from '../components/EmptyState.jsx';
import './pages.css';

function JobDetail() {
  const { id } = useParams();
  const job = jobs.find((j) => j.id === id);

  if (!job) {
    return (
      <div className="container page-body">
        <EmptyState title="भर्ती नहीं मिली" message="यह अधिसूचना उपलब्ध नहीं है या हटा दी गई है।" />
        <div style={{ textAlign: 'center' }}>
          <Link to="/jobs" className="btn btn-outline">
            सभी नौकरियां देखें
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
              { label: 'नौकरियां', to: '/jobs' },
              { label: job.titleHindi },
            ]}
          />
          <span className="eyebrow detail-hero__eyebrow">भर्ती अधिसूचना</span>
          <h1 className="detail-hero__title">{job.titleHindi}</h1>
        </div>
      </div>

      <div className="container page-body">
        <div className="detail-meta">
          <div className="detail-meta__item">
            <span className="detail-meta__label">विभाग</span>
            <span className="detail-meta__value">{job.departmentHindi}</span>
          </div>
          <div className="detail-meta__item">
            <span className="detail-meta__label">प्रकाशित तिथि</span>
            <span className="detail-meta__value">{job.publishedDate}</span>
          </div>
          <div className="detail-meta__item">
            <span className="detail-meta__label">अंतिम तिथि</span>
            <span className="detail-meta__value">{job.lastDate}</span>
          </div>
          <div className="detail-meta__item">
            <span className="detail-meta__label">रिक्तियां</span>
            <span className="detail-meta__value">{job.vacancies}</span>
          </div>
        </div>

        <div className="detail-two-col">
          <div className="detail-section">
            <h2>विवरण</h2>
            <p>{job.description}</p>
          </div>

          <div className="detail-section">
            <h2>भर्ती अधिसूचना (PDF)</h2>
            <PDFViewer src={job.pdf} title={job.titleHindi} />
          </div>
        </div>
      </div>
    </>
  );
}

export default JobDetail;
