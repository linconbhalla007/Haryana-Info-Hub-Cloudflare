import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import jobs from '../data/jobs.js';
import EmptyState from '../components/EmptyState.jsx';
import ListToolbar from '../components/ListToolbar.jsx';
import './pages.css';
import './Jobs.css';

function Jobs() {
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.titleHindi.toLowerCase().includes(q) ||
        j.department.toLowerCase().includes(q) ||
        j.departmentHindi.toLowerCase().includes(q)
    );
  }, [query]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  return (
    <>
      <div className="page-header">
        <div className="container">
          <span className="eyebrow">भर्ती</span>
          <h1 className="page-header__title">सरकारी भर्तियाँ एवं रोजगार जानकारी</h1>
          <p className="page-header__desc">
            हरियाणा सरकार के विभिन्न विभागों में जारी भर्ती अधिसूचनाएं और परीक्षा अपडेट।
          </p>
        </div>
      </div>

      <div className="container page-body">
        <ListToolbar
          value={query}
          onChange={setQuery}
          placeholder="नौकरी खोजें..."
          count={filtered.length}
        />

        {filtered.length === 0 ? (
          <EmptyState message="अलग शब्दों से खोजने का प्रयास करें।" />
        ) : (
          <>
            <div className="jobs-stack-layout">
              {paginatedJobs.map((job) => (
                <div className="job-row-card" key={job.id}>
                  <div className="job-row-card__meta">
                    <span className="tag tag-saffron">
                      {job.departmentHindi || job.department}
                    </span>
                    <div className="job-row-card__meta-details">
                      <span className="job-row-card__date">
                        प्रकाशित: {job.publishedDate}
                      </span>
                      <span className="job-row-card__date" style={{ fontWeight: 700 }}>
                        अंतिम तिथि: {job.lastDate}
                      </span>
                      <span className="job-row-card__vacancies">
                        रिक्तियां: <strong>{job.vacancies}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="job-row-card__content">
                    <h3 className="job-row-card__title">
                      <Link to={`/jobs/${job.id}`}>
                        {job.titleHindi || job.title}
                      </Link>
                    </h3>
                    <p className="job-row-card__desc">{job.description}</p>
                  </div>
                  <div className="job-row-card__actions">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="btn btn-outline btn-sm"
                    >
                      विवरण देखें
                    </Link>
                    <a
                      href={job.pdf}
                      download
                      className="btn btn-green btn-sm"
                    >
                      अधिसूचना डाउनलोड करें
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination__btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                >
                  « पिछला / Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`pagination__btn ${
                      currentPage === page ? 'pagination__btn--active' : ''
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}

                <button
                  className="pagination__btn"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                >
                  अगला / Next »
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default Jobs;
