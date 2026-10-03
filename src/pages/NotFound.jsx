import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

function NotFound() {
  return (
    <div className="not-found">
      <div className="container not-found__inner">
        <span className="not-found__code">404</span>
        <h1>यह पृष्ठ नहीं मिला</h1>
        <p>
          आपके द्वारा खोजा गया पृष्ठ उपलब्ध नहीं है या इसका पता बदल दिया गया है।
        </p>
        <div className="not-found__actions">
          <Link to="/" className="btn btn-primary">
            मुख्य पृष्ठ पर जाएं
          </Link>
          <Link to="/search" className="btn btn-outline">
            खोजें
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
