import React, { useState } from 'react';

function NewsCard({ item }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="list-card">
      <div className="list-card__head">
        <span className="tag tag-muted">{item.category}</span>
        <span className="list-card__date">{item.date}</span>
      </div>
      <h3 className="list-card__title">
        <span>{item.title}</span>
      </h3>
      <p className={`list-card__desc ${open ? '' : 'list-card__desc--clamp'}`}>
        {item.description}
      </p>
      <div className="list-card__footer">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? 'संक्षेप में देखें' : 'पूरा पढ़ें'}
        </button>
      </div>
    </div>
  );
}

export default NewsCard;
