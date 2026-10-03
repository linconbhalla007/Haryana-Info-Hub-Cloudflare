// Service layer for Jobs / Recruitment.
// Swap the local-data lookups below for `GET /api/jobs` calls later.

import jobs from '../data/jobs.js';

export function getAllJobs() {
  return Promise.resolve(jobs);
}

export function getJobById(id) {
  const job = jobs.find((item) => item.id === id);
  return Promise.resolve(job || null);
}
