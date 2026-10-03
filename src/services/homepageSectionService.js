import { getHomepageSectionsPublic } from '../admin/services/adminApi.js';

/**
 * Fetches active public homepage sections from GET /api/homepage-sections
 * Returns array of section objects or empty array if API fails or yields no data.
 */
export async function getPublicHomepageSections() {
  try {
    const res = await getHomepageSectionsPublic();
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
    if (Array.isArray(res)) {
      return res;
    }
    return [];
  } catch (error) {
    console.error("Error fetching public homepage sections:", error);
    return [];
  }
}

export default {
  getPublicHomepageSections,
};
