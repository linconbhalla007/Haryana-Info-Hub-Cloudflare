import React from 'react';
import { Link } from 'react-router-dom';
import './DepartmentCard.css';

function DepartmentCard({ department }) {
  const initial = (department.nameHindi || department.name || '?').trim().charAt(0);
  return (
    <Link to={`/departments/${department.id}`} className="dept-card">
      <div className="dept-card__badge">{initial}</div>
      <div>
        <h3 className="dept-card__title">{department.nameHindi}</h3>
        <p className="dept-card__desc">{department.description}</p>
      </div>
    </Link>
  );
}

export default DepartmentCard;
