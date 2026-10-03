// Service layer for News.
// Swap the local-data lookups below for `GET /api/news` calls later.

import news from '../data/news.js';

export function getAllNews() {
  return Promise.resolve(news);
}

export function getNewsById(id) {
  const item = news.find((n) => n.id === id);
  return Promise.resolve(item || null);
}
