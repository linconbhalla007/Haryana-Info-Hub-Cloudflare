import React, { useState, useMemo } from 'react';
import departments from '../data/departments.js';
import DepartmentCard from '../components/DepartmentCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ListToolbar from '../components/ListToolbar.jsx';
import './pages.css';

function Departments() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.nameHindi.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <>
      <div className="page-header">
        <div className="container">
          <span className="eyebrow">प्रशासन</span>
          <h1 className="page-header__title">विभाग</h1>
          <p className="page-header__desc">
            हरियाणा सरकार के प्रमुख विभागों की सूची।
          </p>
        </div>
      </div>

      <div className="container page-body">
        <ListToolbar
          value={query}
          onChange={setQuery}
          placeholder="विभाग खोजें..."
          count={filtered.length}
        />

        {filtered.length === 0 ? (
          <EmptyState message="अलग शब्दों से खोजने का प्रयास करें।" />
        ) : (
          <div className="grid dept-grid">
            {filtered.map((dept) => (
              <DepartmentCard key={dept.id} department={dept} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Departments;
