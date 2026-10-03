/**
 * Public Service Component for Government Orders.
 * Uses the exact same Cloudflare Worker API as the admin section.
 * Endpoint: GET /api/government-orders
 */
import {
  getGovernmentOrders as fetchGovernmentOrdersApi,
  getGovernmentOrder as fetchGovernmentOrderByIdApi,
} from '../admin/services/adminApi.js';

/**
 * Resolves PDF URL directly from Cloudflare R2 / API response.
 */
export function getPdfUrl(path) {
  return path || "";
}

/**
 * Fetches paginated government orders from Cloudflare API.
 * GET /api/government-orders?page=X&limit=Y
 */
export function getGovernmentOrders(page = 1, limit = 15) {
  return fetchGovernmentOrdersApi(page, limit);
}

/**
 * Fetches all government orders from Cloudflare API for search/filters.
 */
export function getAllGovernmentOrders() {
  return fetchGovernmentOrdersApi(1, 100).then((res) => res.data || []);
}

/**
 * Retrieves a single government order by ID from Cloudflare API.
 * GET /api/government-orders/:id
 */
export function getGovernmentOrderById(id) {
  return fetchGovernmentOrderByIdApi(id);
}

export default {
  getPdfUrl,
  getGovernmentOrders,
  getAllGovernmentOrders,
  getGovernmentOrderById,
};
