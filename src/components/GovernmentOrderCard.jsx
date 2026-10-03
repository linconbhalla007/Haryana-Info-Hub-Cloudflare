import React from 'react';
import { Link } from 'react-router-dom';

function GovernmentOrderCard({ order }) {
  return (
    <div className="list-card">
      <div className="list-card__head">
        <span className="tag tag-green">{order.departmentHindi || order.department}</span>
        <span className="list-card__date">{order.date}</span>
      </div>
      <h3 className="list-card__title">
        <Link to={`/government-orders/${order.id}`}>{order.title}</Link>
      </h3>
      <p className="list-card__desc">{order.description}</p>
      <div className="list-card__footer">
        <Link to={`/government-orders/${order.id}`} className="btn btn-outline btn-sm">
          विवरण देखें
        </Link>
        <a href={order.pdf} download className="btn btn-green btn-sm">
          PDF डाउनलोड करें
        </a>
      </div>
    </div>
  );
}

export default GovernmentOrderCard;
