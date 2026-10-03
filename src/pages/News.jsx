import React, { useState, useMemo } from 'react';
import news from '../data/news.js';
import NewsCard from '../components/NewsCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ListToolbar from '../components/ListToolbar.jsx';
import './pages.css';

function News() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return news;
    return news.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.category.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <>
      <div className="page-header">
        <div className="container">
          <span className="eyebrow">अपडेट</span>
          <h1 className="page-header__title">ताज़ा खबरें</h1>
          <p className="page-header__desc">
            हरियाणा सरकार से जुड़ी नवीनतम समाचार, विभागीय अपडेट और महत्वपूर्ण सूचनाएं।
          </p>
        </div>
      </div>

      <div className="container page-body">
        <ListToolbar
          value={query}
          onChange={setQuery}
          placeholder="खबरें खोजें..."
          count={filtered.length}
        />

        {filtered.length === 0 ? (
          <EmptyState message="अलग शब्दों से खोजने का प्रयास करें।" />
        ) : (
          <div className="grid">
            {filtered.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default News;
