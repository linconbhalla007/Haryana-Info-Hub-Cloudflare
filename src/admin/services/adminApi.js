/**
 * Centralized API Service for Admin Panel
 * Uses VITE_API_BASE_URL with fallback to Cloudflare Workers deployment.
 */
//http://localhost:8787
//https://haryana-info-api.linconbhalla007.workers.dev

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "https://haryana-info-api.linconbhalla007.workers.dev"
).replace(/\/+$/, "");

/**
 * Normalizes HTTP response & error handling
 */
async function handleResponse(response) {
  let data;
  const contentType = response.headers.get("content-type");

  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await response.text();
      data = { message: text };
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    let errorMessage = (data && (data.message || data.error)) || "";
    if (!errorMessage) {
      if (response.status === 401)
        errorMessage = "Invalid credentials or unauthorized access.";
      else if (response.status === 400)
        errorMessage = "Invalid request data. Please check your inputs.";
      else if (response.status === 404)
        errorMessage = "Requested resource not found.";
      else if (response.status >= 500)
        errorMessage = "Server error occurred. Please try again later.";
      else errorMessage = `API Request failed with status ${response.status}.`;
    }
    const err = new Error(errorMessage);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

/**
 * Standard fetch wrapper with timeout & error handling
 */
/**
 * Standard fetch wrapper with timeout & error handling
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers = { ...options.headers };
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    return await handleResponse(response);
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error(
        "Network error. Unable to connect to the backend server.",
      );
    }
    throw error;
  }
}

/**
 * 1. Admin Login API
 * POST /api/login
 */
export async function loginAdmin(username, password) {
  return await apiFetch("/api/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

/**
 * 2. Get Government Orders with server-side pagination
 * GET /api/government-orders?page=1&limit=15
 */
export async function getGovernmentOrders(page = 1, limit = 15) {
  const result = await apiFetch(
    `/api/government-orders?page=${page}&limit=${limit}`,
    {
      method: "GET",
    },
  );

  if (result && Array.isArray(result.data) && result.pagination) {
    return {
      data: result.data,
      pagination: result.pagination,
      count: result.count || result.data.length,
      success: result.success !== false,
    };
  }

  if (Array.isArray(result)) {
    const total = result.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const currPage = Number(page);
    const start = (currPage - 1) * limit;
    const paginatedData = result.slice(start, start + limit);
    return {
      data: paginatedData,
      pagination: {
        page: currPage,
        limit: Number(limit),
        total,
        totalPages,
        hasNextPage: currPage < totalPages,
        hasPreviousPage: currPage > 1,
      },
      count: total,
      success: true,
    };
  }

  if (result && Array.isArray(result.orders)) {
    const total = result.orders.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const currPage = Number(page);
    const start = (currPage - 1) * limit;
    const paginatedData = result.orders.slice(start, start + limit);
    return {
      data: paginatedData,
      pagination: result.pagination || {
        page: currPage,
        limit: Number(limit),
        total,
        totalPages,
        hasNextPage: currPage < totalPages,
        hasPreviousPage: currPage > 1,
      },
      count: total,
      success: true,
    };
  }

  return {
    data: [],
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
    count: 0,
    success: true,
  };
}

/**
 * 3. Get Single Government Order
 * GET /api/government-orders/:id
 */
export async function getGovernmentOrder(id) {
  const result = await apiFetch(
    `/api/government-orders/${encodeURIComponent(id)}`,
    {
      method: "GET",
    },
  );

  if (result && result.order) return result.order;
  if (result && result.data) return result.data;
  return result;
}

/**
 * 4. Create Government Order
 * POST /api/government-orders
 */
export async function createGovernmentOrder(orderData) {
  const isFormData = typeof FormData !== "undefined" && orderData instanceof FormData;
  return await apiFetch("/api/government-orders", {
    method: "POST",
    body: isFormData ? orderData : JSON.stringify(orderData),
  });
}

/**
 * 5. Update Government Order
 * PUT /api/government-orders/:id
 */
export async function updateGovernmentOrder(id, orderData) {
  const isFormData = typeof FormData !== "undefined" && orderData instanceof FormData;
  return await apiFetch(`/api/government-orders/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: isFormData ? orderData : JSON.stringify(orderData),
  });
}

/**
 * 6. Delete Government Order
 * DELETE /api/government-orders/:id
 */
export async function deleteGovernmentOrder(id) {
  return await apiFetch(`/api/government-orders/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/**
 * @typedef {'ACTIVE' | 'SCHEDULED' | 'DISABLED' | 'EXPIRED'} HomepageSectionStatus
 *
 * @typedef {Object} HomepageSection
 * @property {string} _id
 * @property {string} key
 * @property {string} type
 * @property {boolean} enabled
 * @property {string|null} startAt
 * @property {string|null} endAt
 * @property {number} displayOrder
 * @property {Record<string, any>} config
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {HomepageSectionStatus} status
 */

/**
 * 7. Get All Homepage Sections
 * GET /api/homepage-sections/all
 */
export async function getHomepageSections() {
  const result = await apiFetch("/api/homepage-sections/all", {
    method: "GET",
  });

  if (result && Array.isArray(result.data)) {
    return result;
  }
  if (Array.isArray(result)) {
    return { success: true, data: result };
  }
  return { success: true, data: [] };
}

/**
 * 8. Create Homepage Section
 * POST /api/homepage-sections
 */
export async function createHomepageSection(sectionData) {
  return await apiFetch("/api/homepage-sections", {
    method: "POST",
    body: JSON.stringify(sectionData),
  });
}

/**
 * 9. Update Homepage Section
 * PUT /api/homepage-sections/:key
 */
export async function updateHomepageSection(key, sectionData) {
  return await apiFetch(`/api/homepage-sections/${encodeURIComponent(key)}`, {
    method: "PUT",
    body: JSON.stringify(sectionData),
  });
}

/**
 * 10. Toggle Enable/Disable Homepage Section
 * PUT /api/homepage-sections/:key
 * Sends payload { enabled: boolean }
 */
export async function toggleHomepageSectionEnabled(key, enabled) {
  return await apiFetch(`/api/homepage-sections/${encodeURIComponent(key)}`, {
    method: "PUT",
    body: JSON.stringify({ enabled: Boolean(enabled) }),
  });
}

/**
 * 11. Get Public Active Homepage Sections
 * GET /api/homepage-sections
 */
export async function getHomepageSectionsPublic() {
  const result = await apiFetch("/api/homepage-sections", {
    method: "GET",
  });

  if (result && Array.isArray(result.data)) {
    return result;
  }
  if (Array.isArray(result)) {
    return { success: true, data: result };
  }
  return { success: true, data: [] };
}

export default {
  loginAdmin,
  getGovernmentOrders,
  getGovernmentOrder,
  createGovernmentOrder,
  updateGovernmentOrder,
  deleteGovernmentOrder,
  getHomepageSections,
  createHomepageSection,
  updateHomepageSection,
  toggleHomepageSectionEnabled,
  getHomepageSectionsPublic,
};
