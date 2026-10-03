// Service layer for Departments.
// Swap the local-data lookups below for `GET /api/departments` calls later.

import departments from '../data/departments.js';

export function getAllDepartments() {
  return Promise.resolve(departments);
}

export function getDepartmentById(id) {
  const dept = departments.find((item) => item.id === id);
  return Promise.resolve(dept || null);
}
