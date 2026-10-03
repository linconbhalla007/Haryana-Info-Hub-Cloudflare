import React from 'react';
import { Link } from 'react-router-dom';

function SchemeCard({ scheme }) {
  return (
    <div className="list-card">
      <div className="list-card__head">
        <span className="tag tag-green">{scheme.departmentHindi || scheme.department}</span>
      </div>
      <h3 className="list-card__title">
        <Link to={`/schemes/${scheme.id}`}>{scheme.name}</Link>
      </h3>
      <p className="list-card__desc">{scheme.description}</p>
      <div className="list-card__footer">
        <Link to={`/schemes/${scheme.id}`} className="btn btn-outline btn-sm">
          विवरण देखें
        </Link>
      </div>
    </div>
  );
}

export default SchemeCard;
