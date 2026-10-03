// Service layer for Schemes.
// Swap the local-data lookups below for `GET /api/schemes` calls later.

import schemes from '../data/schemes.js';

export function getAllSchemes() {
  return Promise.resolve(schemes);
}

export function getSchemeById(id) {
  const scheme = schemes.find((item) => item.id === id);
  return Promise.resolve(scheme || null);
}
