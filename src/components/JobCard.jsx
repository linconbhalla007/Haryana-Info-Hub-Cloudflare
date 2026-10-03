import React from 'react';
import { Link } from 'react-router-dom';

function JobCard({ job }) {
  return (
    <div className="list-card">
      <div className="list-card__head">
        <span className="tag tag-saffron">{job.departmentHindi || job.department}</span>
        <span className="list-card__date">अंतिम तिथि: {job.lastDate}</span>
      </div>
      <h3 className="list-card__title">
        <Link to={`/jobs/${job.id}`}>{job.titleHindi || job.title}</Link>
      </h3>
      <p className="list-card__desc">{job.description}</p>
      <div className="list-card__meta">
        <span>प्रकाशित: {job.publishedDate}</span>
        <span>रिक्तियां: {job.vacancies}</span>
      </div>
      <div className="list-card__footer">
        <Link to={`/jobs/${job.id}`} className="btn btn-outline btn-sm">
          विवरण देखें
        </Link>
        <a href={job.pdf} download className="btn btn-green btn-sm">
          अधिसूचना डाउनलोड करें
        </a>
      </div>
    </div>
  );
}

export default JobCard;
