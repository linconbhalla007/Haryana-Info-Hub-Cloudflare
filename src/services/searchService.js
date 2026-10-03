// Frontend-only search across all local content types.
// Later this can be replaced by a single `GET /api/search?q=` call.

import jobs from '../data/jobs.js';
import news from '../data/news.js';
import schemes from '../data/schemes.js';
import departments from '../data/departments.js';

function normalize(str) {
  return (str || '').toLowerCase();
}

export function searchAll(query, orders = []) {
  const q = normalize(query).trim();
  if (!q) {
    return { governmentOrders: [], jobs: [], news: [], schemes: [], departments: [] };
  }

  const matchOrders = orders.filter(
    (o) =>
      normalize(o.title).includes(q) ||
      normalize(o.department).includes(q) ||
      normalize(o.departmentHindi).includes(q) ||
      normalize(o.description).includes(q)
  );

  const matchJobs = jobs.filter(
    (j) =>
      normalize(j.title).includes(q) ||
      normalize(j.titleHindi).includes(q) ||
      normalize(j.department).includes(q) ||
      normalize(j.departmentHindi).includes(q) ||
      normalize(j.description).includes(q)
  );

  const matchNews = news.filter(
    (n) =>
      normalize(n.title).includes(q) ||
      normalize(n.category).includes(q) ||
      normalize(n.description).includes(q)
  );

  const matchSchemes = schemes.filter(
    (s) =>
      normalize(s.name).includes(q) ||
      normalize(s.department).includes(q) ||
      normalize(s.departmentHindi).includes(q) ||
      normalize(s.description).includes(q)
  );

  const matchDepartments = departments.filter(
    (d) =>
      normalize(d.name).includes(q) ||
      normalize(d.nameHindi).includes(q) ||
      normalize(d.description).includes(q)
  );

  return {
    governmentOrders: matchOrders,
    jobs: matchJobs,
    news: matchNews,
    schemes: matchSchemes,
    departments: matchDepartments,
  };
}

export function getTotalResultCount(results) {
  return (
    results.governmentOrders.length +
    results.jobs.length +
    results.news.length +
    results.schemes.length +
    results.departments.length
  );
}
