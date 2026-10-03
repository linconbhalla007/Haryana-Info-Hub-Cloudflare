import React, { useState, useMemo } from "react";
import schemes from "../data/schemes.js";
import SchemeCard from "../components/SchemeCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ListToolbar from "../components/ListToolbar.jsx";
import "./pages.css";

function Schemes() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return schemes;
    return schemes.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        s.departmentHindi.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <>
      <div className="page-header">
        <div className="container">
          <span className="eyebrow">कल्याणकारी योजनाएं</span>
          <h1 className="page-header__title">
            reasury/E-Salary/HRMS Information"
          </h1>
          <p className="page-header__desc">
            नई योजनाएं, पात्रता की शर्तें और आवेदन से जुड़ी महत्वपूर्ण जानकारी।
          </p>
        </div>
      </div>

      <div className="container page-body">
        <ListToolbar
          value={query}
          onChange={setQuery}
          placeholder="योजना खोजें..."
          count={filtered.length}
        />

        {filtered.length === 0 ? (
          <EmptyState message="अलग शब्दों से खोजने का प्रयास करें।" />
        ) : (
          <div className="grid">
            {filtered.map((scheme) => (
              <SchemeCard key={scheme.id} scheme={scheme} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Schemes;
